npm run build

cp src/*.php dist
cp -r src/networks dist/
cp -r src/classes dist/
cp -r src/templates dist/


cp LICENSE dist
cp readme.txt dist

cp -r dist social_planner
zip  social_planner.zip social_planner
rm -rf social_planner