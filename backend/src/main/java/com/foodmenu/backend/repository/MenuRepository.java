package com.foodmenu.backend.repository;

import com.foodmenu.backend.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategory(String category);
    List<MenuItem> findByNameContainingIgnoreCase(String name);
}
