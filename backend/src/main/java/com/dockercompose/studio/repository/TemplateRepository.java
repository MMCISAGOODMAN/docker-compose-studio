package com.dockercompose.studio.repository;

import com.dockercompose.studio.domain.Template;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TemplateRepository extends JpaRepository<Template, UUID> {
    Optional<Template> findBySlug(String slug);
    List<Template> findByCategoryOrderByNameAsc(String category);
    List<Template> findAllByOrderByCategoryAscNameAsc();
}
