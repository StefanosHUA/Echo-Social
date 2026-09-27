package com.echo.user.controller;

import com.echo.user.dto.request.LoginRequest;
import com.echo.user.dto.request.RegisterRequest;
import com.echo.user.dto.response.AuthResponse;
import com.echo.user.entity.User;
import com.echo.user.repository.UserRepository;
import com.echo.user.security.JwtService;
import com.echo.user.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository; // Added to fetch user details on refresh

    @Value("${application.security.jwt.refresh-expiration}")
    private int refreshExpirationMs;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse auth = authService.register(request);
        setRefreshCookie(response, auth.getRefreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(auth);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse auth = authService.login(request);
        setRefreshCookie(response, auth.getRefreshToken());
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@CookieValue(name = "echo_refresh", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String username = jwtService.extractUsername(refreshToken);

            if (username != null && jwtService.isTokenValid(refreshToken, username)) {
                // Fetch the user to get their ID
                User user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                // Inject the userId into the new token payload
                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("userId", user.getId().toString());

                String newAccessToken = jwtService.generateToken(extraClaims, user.getUsername());

                AuthResponse authResponse = new AuthResponse();
                authResponse.setToken(newAccessToken);

                return ResponseEntity.ok(authResponse);
            }
        } catch (Exception e) {
            // Token is malformed or signature is invalid
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("echo_refresh", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("echo_refresh", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(refreshExpirationMs / 1000);
        response.addCookie(cookie);
    }
}