package com.echo.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_tastes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTaste {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "spotify_artist_id", nullable = false)
    private String spotifyArtistId;

    @Column(name = "artist_name", nullable = false)
    private String artistName;

    @Column(name = "image_url")
    private String imageUrl;

    @CreationTimestamp
    @Column(name = "added_at", nullable = false, updatable = false)
    private ZonedDateTime addedAt;
}