package com.echo.feed.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class LikeRequest {
    @NotNull
    private UUID userId;
}