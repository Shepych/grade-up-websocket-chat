# Use the official PHP-FPM image as the base image
FROM php:8.2-fpm

# Install the PHP MySQL extension
RUN docker-php-ext-install mysqli pdo pdo_mysql


RUN apt-get update && \
    apt-get install -y unzip git

# Install Composer globally
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN docker-php-ext-install exif

# Set the COMPOSER_ALLOW_SUPERUSER environment variable
ENV COMPOSER_ALLOW_SUPERUSER 1



# Set the working directory
WORKDIR /var/www/grade




# Expose port 9000 (PHP-FPM)
EXPOSE 9000


# Start PHP-FPM
CMD ["php-fpm"]
