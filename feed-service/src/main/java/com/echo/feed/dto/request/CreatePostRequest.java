package com.echo.feed.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class CreatePostRequest {
    @NotNull
    private UUID userId; // Will eventually be extracted from JWT

    @NotBlank
    private String spotifyTrackUri;

    @NotBlank
    private String trackName;
    private String artistName;
    private String albumCoverUrl;
    private String caption;

    @NotBlank
    private String username;
    private String profileImageUrl;

}