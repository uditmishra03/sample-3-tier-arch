FROM nginx:alpine

# Copy website files
COPY public /usr/share/nginx/html

# Expose port 8080 (App Runner expects this port)
EXPOSE 8080

# Update nginx configuration to listen on port 8080
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]