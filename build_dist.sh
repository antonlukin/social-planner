(
    cd dist;

    # Remove all files except .gitignore
    find . -not -name ".gitignore" -delete;
)

# Compiling css and js with gulp
echo "## Compiling css and js with gulp..."
gulp build

# Copying files
echo "## Copying php files..."
cp src/*.php dist
cp -r src/networks dist/
cp -r src/classes dist/
cp -r src/templates dist/

cp LICENSE dist
cp readme.txt dist

# Creating zip for manual distribution
echo "## Creating zip archive..."
cp -r dist social_planner
zip  social_planner.zip social_planner
rm -rf social_planner

echo "## Created zip archive: social_planner.zip"

echo "## Ready to use!"