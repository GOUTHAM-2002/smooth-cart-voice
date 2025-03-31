import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { products, filterOptions, Product } from "@/data/products";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilters } from "@/context/FilterContext";

const sortOptions = [
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Rating", value: "rating" },
];

const ProductListingPage = () => {
  const { category } = useParams<{ category: string }>();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Replace the local state with context
  const { filters, toggleFilter, clearFilters, setPriceRange, setSearchQuery } =
    useFilters();

  // Use the filters directly from context instead of local state
  const selectedFilters = filters;
  const searchQuery = filters.searchQuery;

  // Add the missing getCategoryTitle function
  const getCategoryTitle = () => {
    if (category === "all") return "All Products";
    const categoryInfo = filterOptions.categories.find(
      (c) => c.id === category
    );
    return categoryInfo ? categoryInfo.name : "Products";
  };

  useEffect(() => {
    let filtered = [...products];

    // Filter by category if not "all"
    if (category && category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
      );
    }

    // Apply selected filters
    if (selectedFilters.colors.length > 0) {
      filtered = filtered.filter((p) =>
        p.colors.some((color) => selectedFilters.colors.includes(color))
      );
    }

    if (selectedFilters.sizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.sizes.some((size) => selectedFilters.sizes.includes(size))
      );
    }

    if (selectedFilters.materials.length > 0) {
      filtered = filtered.filter((p) =>
        p.materials.some((material) =>
          selectedFilters.materials.includes(material)
        )
      );
    }

    if (selectedFilters.genders.length > 0) {
      filtered = filtered.filter((p) =>
        selectedFilters.genders.includes(p.gender)
      );
    }

    if (selectedFilters.brands.length > 0) {
      filtered = filtered.filter((p) =>
        selectedFilters.brands.includes(p.brand)
      );
    }

    if (selectedFilters.subCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedFilters.subCategories.includes(p.subCategory)
      );
    }

    // Apply price filter
    filtered = filtered.filter(
      (p) =>
        p.price >= selectedFilters.price[0] &&
        p.price <= selectedFilters.price[1]
    );

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  }, [category, searchQuery, selectedFilters, sortBy]);

  // Update price range handler to use context
  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  // Calculate the active filter count
  const activeFilterCount =
    selectedFilters.colors.length +
    selectedFilters.sizes.length +
    selectedFilters.materials.length +
    selectedFilters.genders.length +
    selectedFilters.brands.length +
    selectedFilters.subCategories.length +
    (selectedFilters.price[0] > 0 || selectedFilters.price[1] < 200 ? 1 : 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getCategoryTitle()}</h1>
          <p className="text-gray-600">
            {filteredProducts.length} products available
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-background p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    className="text-xs h-8 px-2"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Price Range */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Price Range</h4>
                  <Slider
                    defaultValue={[0, 200]}
                    max={200}
                    step={5}
                    value={selectedFilters.price}
                    onValueChange={handlePriceChange}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm">
                    <span>${selectedFilters.price[0]}</span>
                    <span>${selectedFilters.price[1]}</span>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Gender</h4>
                  <div className="space-y-1">
                    {filterOptions.genders.map((gender) => (
                      <div key={gender} className="flex items-center">
                        <Checkbox
                          id={`gender-${gender}`}
                          checked={selectedFilters.genders.includes(gender)}
                          onCheckedChange={() =>
                            toggleFilter("genders", gender)
                          }
                        />
                        <label
                          htmlFor={`gender-${gender}`}
                          className="ml-2 text-sm cursor-pointer capitalize"
                        >
                          {gender}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Categories</h4>
                  <div className="space-y-1">
                    {filterOptions.subCategories.map((subCat) => (
                      <div key={subCat} className="flex items-center">
                        <Checkbox
                          id={`subcat-${subCat}`}
                          checked={selectedFilters.subCategories.includes(
                            subCat
                          )}
                          onCheckedChange={() =>
                            toggleFilter("subCategories", subCat)
                          }
                        />
                        <label
                          htmlFor={`subcat-${subCat}`}
                          className="ml-2 text-sm cursor-pointer capitalize"
                        >
                          {subCat}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Brands</h4>
                  <div className="space-y-1">
                    {filterOptions.brands.map((brand) => (
                      <div key={brand} className="flex items-center">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={selectedFilters.brands.includes(brand)}
                          onCheckedChange={() => toggleFilter("brands", brand)}
                        />
                        <label
                          htmlFor={`brand-${brand}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.colors.map((color) => (
                      <div
                        key={color}
                        className={`w-6 h-6 rounded-full cursor-pointer border ${
                          selectedFilters.colors.includes(color)
                            ? "ring-2 ring-primary ring-offset-2"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => toggleFilter("colors", color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.sizes.map((size) => (
                      <Badge
                        key={size}
                        variant={
                          selectedFilters.sizes.includes(size)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleFilter("sizes", size)}
                      >
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filter Button & Sheet */}
          <div className="lg:hidden my-4">
            <div className="flex gap-2">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-md overflow-auto">
                  <div className="space-y-6 py-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Filters</h3>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          className="text-xs h-8 px-2"
                          onClick={clearFilters}
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    {/* Price Range */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">Price Range</h4>
                      <Slider
                        defaultValue={[0, 200]}
                        max={200}
                        step={5}
                        value={selectedFilters.price}
                        onValueChange={handlePriceChange}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm">
                        <span>${selectedFilters.price[0]}</span>
                        <span>${selectedFilters.price[1]}</span>
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Gender</h4>
                      <div className="space-y-1">
                        {filterOptions.genders.map((gender) => (
                          <div key={gender} className="flex items-center">
                            <Checkbox
                              id={`mobile-gender-${gender}`}
                              checked={selectedFilters.genders.includes(gender)}
                              onCheckedChange={() =>
                                toggleFilter("genders", gender)
                              }
                            />
                            <label
                              htmlFor={`mobile-gender-${gender}`}
                              className="ml-2 text-sm cursor-pointer capitalize"
                            >
                              {gender}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Categories</h4>
                      <div className="space-y-1">
                        {filterOptions.subCategories.map((subCat) => (
                          <div key={subCat} className="flex items-center">
                            <Checkbox
                              id={`mobile-subcat-${subCat}`}
                              checked={selectedFilters.subCategories.includes(
                                subCat
                              )}
                              onCheckedChange={() =>
                                toggleFilter("subCategories", subCat)
                              }
                            />
                            <label
                              htmlFor={`mobile-subcat-${subCat}`}
                              className="ml-2 text-sm cursor-pointer capitalize"
                            >
                              {subCat}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Brands */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Brands</h4>
                      <div className="space-y-1">
                        {filterOptions.brands.map((brand) => (
                          <div key={brand} className="flex items-center">
                            <Checkbox
                              id={`mobile-brand-${brand}`}
                              checked={selectedFilters.brands.includes(brand)}
                              onCheckedChange={() =>
                                toggleFilter("brands", brand)
                              }
                            />
                            <label
                              htmlFor={`mobile-brand-${brand}`}
                              className="ml-2 text-sm cursor-pointer"
                            >
                              {brand}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Colors</h4>
                      <div className="flex flex-wrap gap-2">
                        {filterOptions.colors.map((color) => (
                          <div
                            key={color}
                            className={`w-8 h-8 rounded-full cursor-pointer border ${
                              selectedFilters.colors.includes(color)
                                ? "ring-2 ring-primary ring-offset-2"
                                : ""
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => toggleFilter("colors", color)}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <h4 className="font-medium text-sm mb-2">Sizes</h4>
                      <div className="flex flex-wrap gap-1">
                        {filterOptions.sizes.map((size) => (
                          <Badge
                            key={size}
                            variant={
                              selectedFilters.sizes.includes(size)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleFilter("sizes", size)}
                          >
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full mt-4"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Sort on mobile */}
            <div className="mt-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1">
            {/* Search & Sort - Desktop */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm font-medium">Active Filters:</span>
                {selectedFilters.colors.map((color) => (
                  <Badge
                    key={`badge-color-${color}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{color}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleFilter("colors", color)}
                    />
                  </Badge>
                ))}
                {selectedFilters.sizes.map((size) => (
                  <Badge
                    key={`badge-size-${size}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Size: {size}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleFilter("sizes", size)}
                    />
                  </Badge>
                ))}
                {selectedFilters.brands.map((brand) => (
                  <Badge
                    key={`badge-brand-${brand}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {brand}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleFilter("brands", brand)}
                    />
                  </Badge>
                ))}
                // Fix the price filter badge removal
                {(selectedFilters.price[0] > 0 ||
                  selectedFilters.price[1] < 200) && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    ${selectedFilters.price[0]} - ${selectedFilters.price[1]}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setPriceRange([0, 200])}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="product-card group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {product.isNew && (
                        <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          New
                        </div>
                      )}
                      {product.isBestSeller && (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                          Best Seller
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="font-bold">${product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <p className="text-gray-500 capitalize">
                          {product.brand}
                        </p>
                        <div className="flex items-center">
                          <span className="mr-1">★</span>
                          <span>{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl mb-4">No products found</p>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search term
                </p>
                <Button onClick={clearFilters}>Clear All Filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductListingPage;
