#!/bin/bash

# ============================================================
# rename_images.sh
# Run from: /public/images/
# ============================================================

echo ""
echo "============================================"
echo "  Renaming images (deep mode)..."
echo "============================================"
echo ""

while IFS= read -r -d '' dir; do
  dir_clean="${dir%/}"

  # Pure bash: strip everything up to last slash (no basename command)
  dir_basename="${dir_clean##*/}"

  # Build prefix: lowercase, spaces→_, dashes→_, dots→_
  prefix=$(echo "$dir_basename" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr '-' '_' | tr '.' '_')

  counter=1
  while IFS= read -r -d '' file; do
    ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    # Pure bash: get directory (everything before last slash)
    file_dir="${file%/*}"

    new_name="${prefix}_${counter}.${ext}"
    new_path="${file_dir}/${new_name}"

    mv "$file" "$new_path"
    echo "  ✔  $new_path"
    ((counter++))
  done < <(find "$dir_clean" -maxdepth 1 -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
       -o -iname "*.gif" -o -iname "*.webp" \) -print0 | sort -z)

  total=$((counter - 1))
  [[ $total -gt 0 ]] && echo "     [$total images] $dir_clean  →  prefix: '$prefix'" && echo ""

done < <(find . -mindepth 1 -type d -print0 | sort -z)

# ============================================================
echo ""
echo "============================================"
echo "  ✅ PASTE-READY JS — copy block below:"
echo "============================================"
echo ""

count_imgs() {
  find "$1" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | wc -l | tr -d ' '
}

flap_total=$(count_imgs "FLAP CARD")
letters_c=$(count_imgs "Letters")
scroll_c=$(count_imgs "SCROLL BOX LETTER")
phone_c=$(count_imgs "Phone cover")
polar_c=$(count_imgs "Polaroids")
strips_c=$(count_imgs "PHOTO STRIPS")
frames_c=$(count_imgs "Frames")
vintage_c=$(count_imgs "Vintage frame")
mag_c=$(count_imgs "MAGAZINE")
flapbook_c=$(count_imgs "Flap book")
miniflapbook_c=$(count_imgs "Mini flap book")
cal_c=$(count_imgs "Mini calender")
portrait_c=$(count_imgs "PORTRAITS")
magnet_c=$(count_imgs "Fridge magnets")
hamper_c=$(count_imgs "Hamper")
minicards_c=$(count_imgs "MINI CARDS")

cat << EOF
const IMAGE_SETS = {
  5:  { folder: "FLAP CARD",           prefix: "flap_card",      count: $flap_total },  // Mini Flap Card Hamper
  6:  { folder: "FLAP CARD",           prefix: "flap_card",      count: $flap_total },  // Double Fold Flap Card
  7:  { folder: "FLAP CARD",           prefix: "flap_card",      count: $flap_total },  // Flap Card with Letter
  8:  { folder: "Letters",             prefix: "letter",         count: $letters_c },  // Handwritten Letters
  9:  { folder: "SCROLL BOX LETTER",   prefix: "scroll_box",     count: $scroll_c },  // Scroll Box Letter
  1:  { folder: "Phone cover",         prefix: "phone_cover",    count: $phone_c },  // Phone Case
  2:  { folder: "Polaroids",           prefix: "polaroid",       count: $polar_c },  // Polaroids
  3:  { folder: "PHOTO STRIPS",        prefix: "photo_strip",    count: $strips_c },  // Photobooth Strips
  10: { folder: "Frames",              prefix: "frame",          count: $frames_c },  // Frames
  11: { folder: "Vintage frame",       prefix: "vintage_frame",  count: $vintage_c },  // Vintage Brass Frame
  12: { folder: "MAGAZINE",            prefix: "magazine",       count: $mag_c },  // Personalized Magazine
  13: { folder: "Flap book",           prefix: "flap_book",      count: $flapbook_c },  // Flap Book
  14: { folder: "Mini flap book",      prefix: "mini_flap_book", count: $miniflapbook_c },  // Mini Flap Book
  16: { folder: "Mini calender",       prefix: "mini_calendar",  count: $cal_c },  // Custom Calendar
  15: { folder: "PORTRAITS",           prefix: "portrait",       count: $portrait_c },  // Portraits
  4:  { folder: "Fridge magnets",      prefix: "fridge_magnet",  count: $magnet_c },  // Fridge Magnets
  17: { folder: "Hamper",              prefix: "hamper",         count: $hamper_c },  // Custom Hampers
  18: { folder: "Hamper",              prefix: "hamper",         count: $hamper_c },  // Gift Boxes
  19: { folder: "MINI CARDS",          prefix: "mini_card",      count: $minicards_c },  // Custom Stickers
  20: { folder: "MINI CARDS",          prefix: "mini_card",      count: $minicards_c },  // Gift Tags
};

const GALLERY_IMAGE_SETS = {
  "Flap Books":             { folder: "Flap book",         prefix: "flap_book",   count: $flapbook_c },
  "Handwritten Letters":    { folder: "Letters",           prefix: "letter",      count: $letters_c },
  "Portraits":              { folder: "PORTRAITS",         prefix: "portrait",    count: $portrait_c },
  "Custom Hampers":         { folder: "Hamper",            prefix: "hamper",      count: $hamper_c },
  "Polaroids":              { folder: "Polaroids",         prefix: "polaroid",    count: $polar_c },
  "Personalized Magazines": { folder: "MAGAZINE",          prefix: "magazine",    count: $mag_c },
  "Scroll Box Letters":     { folder: "SCROLL BOX LETTER", prefix: "scroll_box",  count: $scroll_c },
  "Flap Cards":             { folder: "FLAP CARD",         prefix: "flap_card",   count: $flap_total },
};
EOF

echo ""
echo "============================================"
echo "  Done!"
echo "============================================"
#!/bin/bash

# ============================================================
# rename_images.sh
# Run from: /public/images/
# ============================================================

echo ""
echo "============================================"
echo "  Renaming images (deep mode)..."
echo "============================================"
echo ""

while IFS= read -r -d '' dir; do
  dir_clean="${dir%/}"

  # Pure bash: strip everything up to last slash (no basename command)
  dir_basename="${dir_clean##*/}"

  # Build prefix: lowercase, spaces→_, dashes→_, dots→_
  prefix=$(echo "$dir_basename" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr '-' '_' | tr '.' '_')

  counter=1
  while IFS= read -r -d '' file; do
    ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    # Pure bash: get directory (everything before last slash)
    file_dir="${file%/*}"

    new_name="${prefix}_${counter}.${ext}"
    new_path="${file_dir}/${new_name}"

    mv "$file" "$new_path"
    echo "  ✔  $new_path"
    ((counter++))
  done < <(find "$dir_clean" -maxdepth 1 -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
       -o -iname "*.gif" -o -iname "*.webp" \) -print0 | sort -z)

  total=$((counter - 1))
  [[ $total -gt 0 ]] && echo "     [$total images] $dir_clean  →  prefix: '$prefix'" && echo ""

done < <(find . -mindepth 1 -type d -print0 | sort -z)

# ============================================================
echo ""
echo "============================================"
echo "  ✅ PASTE-READY JS — copy block below:"
echo "============================================"
echo ""

count_imgs() {
  find "$1" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | wc -l | tr -d ' '
}

flap_total=$(count_imgs "FLAP CARD")
letters_c=$(count_imgs "Letters")
scroll_c=$(count_imgs "SCROLL BOX LETTER")
phone_c=$(count_imgs "Phone cover")
polar_c=$(count_imgs "Polaroids")
strips_c=$(count_imgs "PHOTO STRIPS")
frames_c=$(count_imgs "Frames")
vintage_c=$(count_imgs "Vintage frame")
mag_c=$(count_imgs "MAGAZINE")
flapbook_c=$(count_imgs "Flap book")
miniflapbook_c=$(count_imgs "Mini flap book")
cal_c=$(count_imgs "Mini calender")
portrait_c=$(count_imgs "PORTRAITS")
magnet_c=$(count_imgs "Fridge magnets")
hamper_c=$(count_imgs "Hamper")
minicards_c=$(count_imgs "MINI CARDS")

cat << EOF
const IMAGE_SETS = {
  5:  { folder: "FLAP CARD",           prefix: "flap_card",      count: $flap_total },  // Mini Flap Card Hamper
  6:  { folder: "FLAP CARD",           prefix: "flap_card",      count: $flap_total },  // Double Fold Flap Card
  7:  { folder: "FLAP CARD",           prefix: "flap_card",      count: $flap_total },  // Flap Card with Letter
  8:  { folder: "Letters",             prefix: "letter",         count: $letters_c },  // Handwritten Letters
  9:  { folder: "SCROLL BOX LETTER",   prefix: "scroll_box",     count: $scroll_c },  // Scroll Box Letter
  1:  { folder: "Phone cover",         prefix: "phone_cover",    count: $phone_c },  // Phone Case
  2:  { folder: "Polaroids",           prefix: "polaroid",       count: $polar_c },  // Polaroids
  3:  { folder: "PHOTO STRIPS",        prefix: "photo_strip",    count: $strips_c },  // Photobooth Strips
  10: { folder: "Frames",              prefix: "frame",          count: $frames_c },  // Frames
  11: { folder: "Vintage frame",       prefix: "vintage_frame",  count: $vintage_c },  // Vintage Brass Frame
  12: { folder: "MAGAZINE",            prefix: "magazine",       count: $mag_c },  // Personalized Magazine
  13: { folder: "Flap book",           prefix: "flap_book",      count: $flapbook_c },  // Flap Book
  14: { folder: "Mini flap book",      prefix: "mini_flap_book", count: $miniflapbook_c },  // Mini Flap Book
  16: { folder: "Mini calender",       prefix: "mini_calendar",  count: $cal_c },  // Custom Calendar
  15: { folder: "PORTRAITS",           prefix: "portrait",       count: $portrait_c },  // Portraits
  4:  { folder: "Fridge magnets",      prefix: "fridge_magnet",  count: $magnet_c },  // Fridge Magnets
  17: { folder: "Hamper",              prefix: "hamper",         count: $hamper_c },  // Custom Hampers
  18: { folder: "Hamper",              prefix: "hamper",         count: $hamper_c },  // Gift Boxes
  19: { folder: "MINI CARDS",          prefix: "mini_card",      count: $minicards_c },  // Custom Stickers
  20: { folder: "MINI CARDS",          prefix: "mini_card",      count: $minicards_c },  // Gift Tags
};

const GALLERY_IMAGE_SETS = {
  "Flap Books":             { folder: "Flap book",         prefix: "flap_book",   count: $flapbook_c },
  "Handwritten Letters":    { folder: "Letters",           prefix: "letter",      count: $letters_c },
  "Portraits":              { folder: "PORTRAITS",         prefix: "portrait",    count: $portrait_c },
  "Custom Hampers":         { folder: "Hamper",            prefix: "hamper",      count: $hamper_c },
  "Polaroids":              { folder: "Polaroids",         prefix: "polaroid",    count: $polar_c },
  "Personalized Magazines": { folder: "MAGAZINE",          prefix: "magazine",    count: $mag_c },
  "Scroll Box Letters":     { folder: "SCROLL BOX LETTER", prefix: "scroll_box",  count: $scroll_c },
  "Flap Cards":             { folder: "FLAP CARD",         prefix: "flap_card",   count: $flap_total },
};
EOF

echo ""
echo "============================================"
echo "  Done!"
echo "============================================"


