package com.echo.user.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class GroupieResponse {
    private UUID userId;
    private String username;
    private String profileImageUrl;
    private int matchScore; // Number of shared artists
    private List<String> sharedArtistNames;
}