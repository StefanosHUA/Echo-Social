package com.echo.feed.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class PostResponse {
    private UUID id;
    private UUID userId;
    private String spotifyTrackUri;
    private String trackName;
    private String artistName;
    private String albumCoverUrl;
    private String caption;
    private String username;
    private String profileImageUrl;
    private Long likeCount;
    private ZonedDateTime createdAt;
    private List<CommentResponse> comments;
    private boolean likedByCurrentUser;
}