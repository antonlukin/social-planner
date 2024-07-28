(
    cd dist;

    # Remove all files except .gitignore
    find . -not -name ".gitignore" -delete

    # Creating symlinks
    echo "## Creating php symlinks..."
    ln -s ../src/*.php .
    ln -s ../src/networks .
    ln -s ../src/classes .
    ln -s ../src/templates .
    ln -s ../LICENSE .
    ln -s ../readme.txt .
)

# Compiling css and js with gulp
echo "## Compiling css and js with gulp..."
gulp build

echo "## Ready to use!"