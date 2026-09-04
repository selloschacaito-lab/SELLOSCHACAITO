import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Plugin de Vite para escanear y servir dinámicamente todos los SVG de public/iconos
function scanIconsPlugin() {
  return {
    name: 'scan-icons-plugin',
    configureServer(server) {
      server.middlewares.use('/api/icons', (req, res) => {
        try {
          const iconosDir = path.resolve(process.cwd(), 'public', 'iconos');
          const results = [];

          if (fs.existsSync(iconosDir)) {
            const categories = fs.readdirSync(iconosDir);

            for (const cat of categories) {
              const catPath = path.join(iconosDir, cat);
              if (fs.statSync(catPath).isDirectory()) {
                const files = fs.readdirSync(catPath);
                for (const file of files) {
                  if (file.toLowerCase().endsWith('.svg')) {
                    const filePath = path.join(catPath, file);
                    const svgContent = fs.readFileSync(filePath, 'utf-8');
                    const cleanName = file.replace(/\.svg$/i, '').replace(/[-_]/g, ' ');

                    results.push({
                      id: `folder-${cat}-${file}`,
                      categoryId: cat,
                      label: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                      svgContent,
                      isCustom: true,
                      filename: file,
                    });
                  }
                }
              }
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(results));
        } catch (err) {
          console.error('Error scanning icons directory:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Error scanning icons' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    scanIconsPlugin(),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    fs: {
      strict: false,
    },
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },
});
