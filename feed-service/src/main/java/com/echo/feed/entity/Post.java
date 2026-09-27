package com.echo.feed.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId; // References User-Service

    @Column(nullable = false)
    private String username;

    @Column(name = "spotify_track_uri", nullable = false)
    private String spotifyTrackUri;

    @Column(name = "track_name")
    private String trackName;

    @Column(name = "artist_name")
    private String artistName;

    @Column(name = "album_cover_url", length = 500)
    private String albumCoverUrl;

    @Column(length = 500)
    private String caption;

    @Column(name = "event_id")
    private UUID eventId; // Placeholder for Event-Service integration

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private Long likeCount = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PostLike> likes = new ArrayList<>();

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

}