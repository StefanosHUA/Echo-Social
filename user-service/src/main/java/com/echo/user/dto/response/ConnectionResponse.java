package com.echo.user.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class ConnectionResponse {
    private UUID userId;
    private String username;
    private String profileImageUrl;
}