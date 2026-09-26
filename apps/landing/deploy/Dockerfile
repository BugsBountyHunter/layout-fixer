# The site is a static export built on the developer machine (`npm run build`), so the image only serves `out/`.
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
