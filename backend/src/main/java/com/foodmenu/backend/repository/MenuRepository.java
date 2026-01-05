package com.foodmenu.backend.repository;

import com.foodmenu.backend.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MenuRepository extends JpaRepository<MenuItem, Long> {
    @Query(value = "SELECT * FROM menu_items WHERE category = :category", nativeQuery = true)
    List<MenuItem> findByCategory(@Param("category") String category);

    @Query(value = "SELECT * FROM menu_items WHERE LOWER(name) LIKE LOWER(CONCAT('%', :name, '%'))", nativeQuery = true)
    List<MenuItem> findByNameContainingIgnoreCase(@Param("name") String name);
}
