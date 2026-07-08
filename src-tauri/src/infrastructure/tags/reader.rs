use std::path::Path;

use lofty::file::{AudioFile, TaggedFileExt};
use lofty::prelude::ItemKey;
use lofty::tag::Accessor;

/// Metadata extracted from an audio file's embedded tags.
#[derive(Debug, Default, Clone)]
pub struct TrackTags {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration_secs: Option<u32>,
    /// Raw embedded cover art bytes, if present.
    pub cover_art: Option<Vec<u8>>,
}

/// Reads tags from an audio file. Returns default (all-None) on failure so the
/// scanner can still register the track with fallback metadata.
pub fn read_tags(path: &Path) -> TrackTags {
    let Ok(tagged_file) = lofty::read_from_path(path) else {
        return TrackTags::default();
    };

    let mut tags = TrackTags {
        duration_secs: Some(tagged_file.properties().duration().as_secs() as u32),
        ..TrackTags::default()
    };

    let tag = tagged_file
        .primary_tag()
        .or_else(|| tagged_file.first_tag());

    if let Some(tag) = tag {
        tags.title = tag.title().map(|s| s.to_string()).filter(|s| !s.is_empty());
        tags.artist = tag
            .artist()
            .map(|s| s.to_string())
            .filter(|s| !s.is_empty());
        tags.album = tag.album().map(|s| s.to_string()).filter(|s| !s.is_empty());

        if tags.album.is_none() {
            tags.album = tag
                .get_string(&ItemKey::AlbumTitle)
                .map(|s| s.to_string())
                .filter(|s| !s.is_empty());
        }

        if let Some(picture) = tag.pictures().first() {
            tags.cover_art = Some(picture.data().to_vec());
        }
    }

    tags
}
