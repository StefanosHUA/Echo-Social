package com.echo.feed.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class CommentResponse {
    private UUID id;
    private UUID userId;
    private String content;
    private ZonedDateTime createdAt;
}