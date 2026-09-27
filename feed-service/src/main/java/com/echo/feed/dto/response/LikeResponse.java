package com.echo.feed.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikeResponse {
    private UUID postId;
    private Long likeCount;
    private boolean liked; // true if liked, false if unliked (toggled off)
}