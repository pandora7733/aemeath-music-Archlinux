use std::collections::HashSet;
use std::path::Path;
use std::sync::Mutex;

use rusqlite::{params, Connection, Row};

use crate::models::library_groups::{AlbumGroup, ArtistGroup};
use crate::models::media_item::{MediaItem, MediaSource, MediaType};
use crate::models::playlist::{Playlist, PlaylistDetail};
use crate::services::library::{LibraryKind, LibrarySort};

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn connect(db_path: &Path) -> Result<Self, String> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| {
                format!("데이터 디렉터리를 생성할 수 없습니다 ({}): {e}", parent.display())
            })?;
        }

        let conn = Connection::open(db_path)
            .map_err(|e| format!("데이터베이스를 열 수 없습니다 ({}): {e}", db_path.display()))?;
        conn.pragma_update(None, "journal_mode", "WAL")
            .map_err(|e| format!("WAL 모드 설정 실패: {e}"))?;
        conn.pragma_update(None, "foreign_keys", "ON")
            .map_err(|e| format!("외래키 설정 실패: {e}"))?;

        let db = Self {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    fn run_migrations(&self) -> Result<(), String> {
        let conn = self.lock()?;
        ensure_legacy_tracks_columns(&conn)?;
        ensure_legacy_playlists_columns(&conn)?;

        let sql = include_str!("migrations/001_init.sql");
        conn.execute_batch(sql)
            .map_err(|e| format!("마이그레이션 실패: {e}"))?;

        // Backfill for legacy rows: if added_at was newly introduced, keep a
        // sensible ordering by reusing modified_at when added_at == 0.
        conn.execute(
            "UPDATE tracks SET added_at = modified_at WHERE added_at = 0",
            [],
        )
        .map_err(|e| format!("tracks.added_at 보정 실패: {e}"))?;
        conn.execute(
            "UPDATE playlists SET updated_at = created_at WHERE updated_at = 0",
            [],
        )
        .map_err(|e| format!("playlists.updated_at 보정 실패: {e}"))?;

        Ok(())
    }

    fn lock(&self) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
        self.conn
            .lock()
            .map_err(|_| "데이터베이스 잠금에 실패했습니다.".to_string())
    }

    /// Inserts or updates scanned tracks. Existing rows keep their original
    /// `added_at`; new rows get the current timestamp so "recently added"
    /// ordering is stable.
    pub fn upsert_tracks(&self, items: &[MediaItem]) -> Result<usize, String> {
        let now = now_ts();
        let mut conn = self.lock()?;
        let tx = conn
            .transaction()
            .map_err(|e| format!("트랜잭션 시작 실패: {e}"))?;

        for item in items {
            tx.execute(
                "INSERT INTO tracks (id, path, title, artist, album, duration_secs, media_type, extension, file_size, modified_at, cover_path, added_at, source)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
                 ON CONFLICT(id) DO UPDATE SET
                   path = excluded.path,
                   title = excluded.title,
                   artist = excluded.artist,
                   album = excluded.album,
                   duration_secs = excluded.duration_secs,
                   media_type = excluded.media_type,
                   extension = excluded.extension,
                   file_size = excluded.file_size,
                   modified_at = excluded.modified_at,
                   cover_path = excluded.cover_path,
                   source = excluded.source",
                params![
                    item.id,
                    item.path,
                    item.title,
                    item.artist,
                    item.album,
                    item.duration_secs,
                    item.media_type.as_str(),
                    item.extension,
                    item.file_size as i64,
                    item.modified_at,
                    item.cover_path,
                    now,
                    item.source.as_str(),
                ],
            )
            .map_err(|e| format!("트랙 저장 실패: {e}"))?;
        }

        tx.commit().map_err(|e| format!("트랜잭션 커밋 실패: {e}"))?;
        Ok(items.len())
    }

    /// Removes tracks whose paths are no longer present in the given set of
    /// currently-scanned local paths.
    pub fn prune_missing_local(&self, existing_paths: &[String]) -> Result<usize, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare("SELECT id, path FROM tracks WHERE source = 'local'")
            .map_err(|e| format!("트랙 조회 실패: {e}"))?;
        let rows: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| format!("트랙 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        let mut removed = 0;
        for (id, path) in rows {
            if !existing_paths.contains(&path) {
                conn.execute("DELETE FROM tracks WHERE id = ?1", params![id])
                    .map_err(|e| format!("트랙 삭제 실패: {e}"))?;
                removed += 1;
            }
        }
        Ok(removed)
    }

    pub fn list_tracks(
        &self,
        kind: LibraryKind,
        sort: LibrarySort,
    ) -> Result<Vec<MediaItem>, String> {
        let where_clause = match kind {
            LibraryKind::All => "",
            LibraryKind::Audio => "WHERE media_type = 'audio'",
            LibraryKind::Video => "WHERE media_type = 'video'",
        };
        let order_clause = match sort {
            LibrarySort::Title => "ORDER BY title COLLATE NOCASE ASC",
            LibrarySort::Modified => "ORDER BY modified_at DESC",
        };
        let sql = format!(
            "SELECT id, path, title, artist, album, duration_secs, media_type, extension, file_size, modified_at, cover_path, added_at, source FROM tracks {where_clause} {order_clause}"
        );

        let conn = self.lock()?;
        let mut stmt = conn.prepare(&sql).map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let items = stmt
            .query_map([], row_to_media_item)
            .map_err(|e| format!("트랙 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn recently_added(&self, limit: u32) -> Result<Vec<MediaItem>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, path, title, artist, album, duration_secs, media_type, extension, file_size, modified_at, cover_path, added_at, source
                 FROM tracks WHERE media_type = 'audio' ORDER BY added_at DESC, modified_at DESC LIMIT ?1",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let items = stmt
            .query_map(params![limit], row_to_media_item)
            .map_err(|e| format!("최근 추가 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn albums(&self) -> Result<Vec<AlbumGroup>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT COALESCE(album, '') AS album_name, COALESCE(artist, '') AS artist_name,
                        COUNT(*) AS track_count,
                        MAX(cover_path) AS cover
                 FROM tracks
                 WHERE media_type = 'audio' AND album IS NOT NULL AND album <> ''
                 GROUP BY album_name, artist_name
                 ORDER BY album_name COLLATE NOCASE ASC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let groups = stmt
            .query_map([], |row| {
                Ok(AlbumGroup {
                    album: row.get(0)?,
                    artist: row.get(1)?,
                    track_count: row.get::<_, i64>(2)? as u32,
                    cover_path: row.get(3)?,
                })
            })
            .map_err(|e| format!("앨범 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(groups)
    }

    pub fn album_tracks(&self, artist: &str, album: &str) -> Result<Vec<MediaItem>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, path, title, artist, album, duration_secs, media_type, extension, file_size, modified_at, cover_path, added_at, source
                 FROM tracks WHERE media_type = 'audio' AND COALESCE(artist,'') = ?1 AND COALESCE(album,'') = ?2
                 ORDER BY title COLLATE NOCASE ASC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let items = stmt
            .query_map(params![artist, album], row_to_media_item)
            .map_err(|e| format!("앨범 트랙 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn artists(&self) -> Result<Vec<ArtistGroup>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT COALESCE(artist, '') AS artist_name,
                        COUNT(*) AS track_count,
                        COUNT(DISTINCT COALESCE(album,'')) AS album_count
                 FROM tracks
                 WHERE media_type = 'audio' AND artist IS NOT NULL AND artist <> ''
                 GROUP BY artist_name
                 ORDER BY artist_name COLLATE NOCASE ASC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let groups = stmt
            .query_map([], |row| {
                Ok(ArtistGroup {
                    artist: row.get(0)?,
                    track_count: row.get::<_, i64>(1)? as u32,
                    album_count: row.get::<_, i64>(2)? as u32,
                })
            })
            .map_err(|e| format!("아티스트 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(groups)
    }

    pub fn artist_tracks(&self, artist: &str) -> Result<Vec<MediaItem>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, path, title, artist, album, duration_secs, media_type, extension, file_size, modified_at, cover_path, added_at, source
                 FROM tracks WHERE media_type = 'audio' AND COALESCE(artist,'') = ?1
                 ORDER BY album COLLATE NOCASE ASC, title COLLATE NOCASE ASC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let items = stmt
            .query_map(params![artist], row_to_media_item)
            .map_err(|e| format!("아티스트 트랙 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    // ----- Favorites -----

    pub fn favorite_toggle(&self, track_id: &str) -> Result<bool, String> {
        let conn = self.lock()?;
        let exists: bool = conn
            .query_row(
                "SELECT 1 FROM favorites WHERE track_id = ?1",
                params![track_id],
                |_| Ok(true),
            )
            .unwrap_or(false);

        if exists {
            conn.execute("DELETE FROM favorites WHERE track_id = ?1", params![track_id])
                .map_err(|e| format!("즐겨찾기 삭제 실패: {e}"))?;
            Ok(false)
        } else {
            conn.execute(
                "INSERT INTO favorites (track_id, favorited_at) VALUES (?1, ?2)",
                params![track_id, now_ts()],
            )
            .map_err(|e| format!("즐겨찾기 추가 실패: {e}"))?;
            Ok(true)
        }
    }

    pub fn favorite_ids(&self) -> Result<Vec<String>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare("SELECT track_id FROM favorites")
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let ids = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|e| format!("즐겨찾기 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(ids)
    }

    pub fn favorite_tracks(&self) -> Result<Vec<MediaItem>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.path, t.title, t.artist, t.album, t.duration_secs, t.media_type, t.extension, t.file_size, t.modified_at, t.cover_path, t.added_at, t.source
                 FROM tracks t INNER JOIN favorites f ON f.track_id = t.id
                 ORDER BY f.favorited_at DESC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let items = stmt
            .query_map([], row_to_media_item)
            .map_err(|e| format!("즐겨찾기 트랙 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    // ----- Playlists -----

    pub fn playlist_create(&self, name: &str) -> Result<Playlist, String> {
        let id = new_id();
        let created_at = now_ts();
        let conn = self.lock()?;
        conn.execute(
            "INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, name, created_at, created_at],
        )
        .map_err(|e| format!("플레이리스트 생성 실패: {e}"))?;
        Ok(Playlist {
            id,
            name: name.to_string(),
            created_at,
            track_count: 0,
        })
    }

    pub fn playlist_rename(&self, id: &str, name: &str) -> Result<(), String> {
        let conn = self.lock()?;
        conn.execute(
            "UPDATE playlists SET name = ?2, updated_at = ?3 WHERE id = ?1",
            params![id, name, now_ts()],
        )
        .map_err(|e| format!("플레이리스트 이름 변경 실패: {e}"))?;
        Ok(())
    }

    pub fn playlist_delete(&self, id: &str) -> Result<(), String> {
        let conn = self.lock()?;
        conn.execute("DELETE FROM playlists WHERE id = ?1", params![id])
            .map_err(|e| format!("플레이리스트 삭제 실패: {e}"))?;
        Ok(())
    }

    pub fn playlist_list(&self) -> Result<Vec<Playlist>, String> {
        let conn = self.lock()?;
        let mut stmt = conn
            .prepare(
                "SELECT p.id, p.name, p.created_at, COUNT(pt.track_id) AS track_count
                 FROM playlists p LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
                 GROUP BY p.id ORDER BY COALESCE(p.updated_at, p.created_at) DESC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let items = stmt
            .query_map([], |row| {
                Ok(Playlist {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                    track_count: row.get::<_, i64>(3)? as u32,
                })
            })
            .map_err(|e| format!("플레이리스트 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn playlist_get(&self, id: &str) -> Result<PlaylistDetail, String> {
        let conn = self.lock()?;
        let (name, created_at): (String, i64) = conn
            .query_row(
                "SELECT name, created_at FROM playlists WHERE id = ?1",
                params![id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| format!("플레이리스트를 찾을 수 없습니다: {e}"))?;

        let mut stmt = conn
            .prepare(
                "SELECT t.id, t.path, t.title, t.artist, t.album, t.duration_secs, t.media_type, t.extension, t.file_size, t.modified_at, t.cover_path, t.added_at, t.source
                 FROM playlist_tracks pt INNER JOIN tracks t ON t.id = pt.track_id
                 WHERE pt.playlist_id = ?1 ORDER BY pt.position ASC",
            )
            .map_err(|e| format!("쿼리 준비 실패: {e}"))?;
        let tracks = stmt
            .query_map(params![id], row_to_media_item)
            .map_err(|e| format!("플레이리스트 트랙 조회 실패: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(PlaylistDetail {
            id: id.to_string(),
            name,
            created_at,
            tracks,
        })
    }

    pub fn playlist_add_track(&self, playlist_id: &str, track_id: &str) -> Result<(), String> {
        let conn = self.lock()?;
        let next_pos: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(position), -1) + 1 FROM playlist_tracks WHERE playlist_id = ?1",
                params![playlist_id],
                |row| row.get(0),
            )
            .unwrap_or(0);
        conn.execute(
            "INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?1, ?2, ?3)",
            params![playlist_id, track_id, next_pos],
        )
        .map_err(|e| format!("플레이리스트에 곡 추가 실패: {e}"))?;
        Ok(())
    }

    pub fn playlist_remove_track(&self, playlist_id: &str, track_id: &str) -> Result<(), String> {
        let conn = self.lock()?;
        conn.execute(
            "DELETE FROM playlist_tracks WHERE playlist_id = ?1 AND track_id = ?2",
            params![playlist_id, track_id],
        )
        .map_err(|e| format!("플레이리스트에서 곡 제거 실패: {e}"))?;
        Ok(())
    }

    pub fn playlist_reorder(&self, playlist_id: &str, ordered_ids: &[String]) -> Result<(), String> {
        let mut conn = self.lock()?;
        let tx = conn
            .transaction()
            .map_err(|e| format!("트랜잭션 시작 실패: {e}"))?;
        for (position, track_id) in ordered_ids.iter().enumerate() {
            tx.execute(
                "UPDATE playlist_tracks SET position = ?3 WHERE playlist_id = ?1 AND track_id = ?2",
                params![playlist_id, track_id, position as i64],
            )
            .map_err(|e| format!("순서 변경 실패: {e}"))?;
        }
        tx.commit().map_err(|e| format!("트랜잭션 커밋 실패: {e}"))?;
        Ok(())
    }
}

fn ensure_legacy_tracks_columns(conn: &Connection) -> Result<(), String> {
    let has_tracks_table: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='tracks')",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map(|v| v != 0)
        .map_err(|e| format!("기존 tracks 테이블 확인 실패: {e}"))?;

    if !has_tracks_table {
        return Ok(());
    }

    let mut stmt = conn
        .prepare("PRAGMA table_info(tracks)")
        .map_err(|e| format!("tracks 스키마 조회 실패: {e}"))?;
    let columns: HashSet<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| format!("tracks 컬럼 조회 실패: {e}"))?
        .filter_map(|r| r.ok())
        .collect();

    add_column_if_missing(conn, &columns, "artist", "TEXT")?;
    add_column_if_missing(conn, &columns, "album", "TEXT")?;
    add_column_if_missing(conn, &columns, "duration_secs", "INTEGER")?;
    add_column_if_missing(
        conn,
        &columns,
        "media_type",
        "TEXT NOT NULL DEFAULT 'audio'",
    )?;
    add_column_if_missing(conn, &columns, "extension", "TEXT NOT NULL DEFAULT ''")?;
    add_column_if_missing(conn, &columns, "file_size", "INTEGER NOT NULL DEFAULT 0")?;
    add_column_if_missing(conn, &columns, "modified_at", "INTEGER NOT NULL DEFAULT 0")?;
    add_column_if_missing(conn, &columns, "cover_path", "TEXT")?;
    add_column_if_missing(conn, &columns, "added_at", "INTEGER NOT NULL DEFAULT 0")?;
    add_column_if_missing(conn, &columns, "source", "TEXT NOT NULL DEFAULT 'local'")?;

    Ok(())
}

fn ensure_legacy_playlists_columns(conn: &Connection) -> Result<(), String> {
    let has_playlists_table: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='playlists')",
            [],
            |row| row.get::<_, i64>(0),
        )
        .map(|v| v != 0)
        .map_err(|e| format!("기존 playlists 테이블 확인 실패: {e}"))?;

    if !has_playlists_table {
        return Ok(());
    }

    let mut stmt = conn
        .prepare("PRAGMA table_info(playlists)")
        .map_err(|e| format!("playlists 스키마 조회 실패: {e}"))?;
    let columns: HashSet<String> = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| format!("playlists 컬럼 조회 실패: {e}"))?
        .filter_map(|r| r.ok())
        .collect();

    add_column_if_missing(conn, &columns, "description", "TEXT")?;
    add_column_if_missing(conn, &columns, "created_at", "INTEGER NOT NULL DEFAULT 0")?;
    add_column_if_missing(conn, &columns, "updated_at", "INTEGER NOT NULL DEFAULT 0")?;

    Ok(())
}

fn add_column_if_missing(
    conn: &Connection,
    columns: &HashSet<String>,
    column_name: &str,
    column_sql: &str,
) -> Result<(), String> {
    if columns.contains(column_name) {
        return Ok(());
    }

    conn.execute(
        &format!("ALTER TABLE tracks ADD COLUMN {column_name} {column_sql}"),
        [],
    )
    .map_err(|e| format!("tracks.{column_name} 컬럼 추가 실패: {e}"))?;
    Ok(())
}

fn row_to_media_item(row: &Row<'_>) -> rusqlite::Result<MediaItem> {
    let media_type: String = row.get(6)?;
    let source: String = row.get(12)?;
    Ok(MediaItem {
        id: row.get(0)?,
        path: row.get(1)?,
        title: row.get(2)?,
        artist: row.get(3)?,
        album: row.get(4)?,
        duration_secs: row.get(5)?,
        media_type: MediaType::from_str(&media_type),
        extension: row.get(7)?,
        file_size: row.get::<_, i64>(8)? as u64,
        modified_at: row.get(9)?,
        cover_path: row.get(10)?,
        added_at: row.get(11)?,
        source: MediaSource::from_str(&source),
    })
}

fn now_ts() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn new_id() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let seed = format!("{}-{}", nanos, std::process::id());
    blake3::hash(seed.as_bytes()).to_hex().to_string()[..16].to_string()
}
