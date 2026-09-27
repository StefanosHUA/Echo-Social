package com.echo.user.dto.request;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String username;
    private String email;
    private String profileImageUrl;
}