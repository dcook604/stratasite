#!/bin/bash
# Enhanced deployment script with performance optimizations

echo "🚀 Starting deployment with performance fixes..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Build the application with optimizations
echo "📦 Building application with performance optimizations..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found after build."
    exit 1
fi

echo "📊 Build statistics:"
echo "   HTML files: $(find dist -name "*.html" | wc -l)"
echo "   JS files: $(find dist -name "*.js" | wc -l)"
echo "   CSS files: $(find dist -name "*.css" | wc -l)"
echo "   Total assets: $(find dist/assets -type f | wc -l 2>/dev/null || echo "0")"

# Display asset sizes for optimization tracking
if [ -d "dist/assets" ]; then
    echo "📏 Asset sizes:"
    find dist/assets -name "*.js" -exec ls -lh {} \; | awk '{print "   JS: " $9 " (" $5 ")"}'
    find dist/assets -name "*.css" -exec ls -lh {} \; | awk '{print "   CSS: " $9 " (" $5 ")"}'
fi

echo "🚀 Application built and ready for deployment!"
echo ""
echo "💡 Performance optimizations applied:"
echo "   ✅ Canonical URLs configured"
echo "   ✅ Asset caching headers optimized"
echo "   ✅ Domain redirect handling improved"
echo "   ✅ Build output organized by type"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy the 'dist' directory to your hosting platform"
echo "   2. Ensure your reverse proxy/CDN respects cache headers"
echo "   3. Monitor performance improvements"
echo ""
echo "🎯 Expected improvements:"
echo "   • Reduced asset loading time"
echo "   • Eliminated redirect overhead"
echo "   • Better browser caching"
echo "   • Faster page loads"