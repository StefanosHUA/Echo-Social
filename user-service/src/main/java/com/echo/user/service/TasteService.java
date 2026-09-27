package com.echo.user.service;

import com.echo.user.dto.request.ArtistDTO;
import com.echo.user.entity.UserTaste;
import com.echo.user.repository.UserTasteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TasteService {

    private final UserTasteRepository tasteRepository;

    @Transactional
    public void saveInitialTastes(UUID userId, List<ArtistDTO> artists) {
        if (artists == null || artists.size() < 3) {
            throw new IllegalArgumentException("You must have at least 3 artists on rotation.");
        }

        List<UserTaste> tastes = artists.stream().map(artist ->
                UserTaste.builder()
                        .userId(userId)
                        .spotifyArtistId(artist.getId())
                        .artistName(artist.getName())
                        .imageUrl(artist.getImageUrl())
                        .build()
        ).collect(Collectors.toList());

        tasteRepository.saveAll(tastes);
    }

    public List<ArtistDTO> getUserTastes(UUID userId) {
        // Find the user's tastes in the repository and map them to ArtistDTOs
        return tasteRepository.findByUserId(userId).stream()
                .map(taste -> {
                    ArtistDTO dto = new ArtistDTO();
                    dto.setId(taste.getSpotifyArtistId());
                    dto.setName(taste.getArtistName());
                    dto.setImageUrl(taste.getImageUrl());
                    return dto;
                })
                .toList();
    }

    @Transactional
    public void updateUserTastes(UUID userId, List<ArtistDTO> artists) {
        // 1. Delete existing tastes for this user
        tasteRepository.deleteByUserId(userId);

        // 2. Save the new list
        saveInitialTastes(userId, artists);
    }

}