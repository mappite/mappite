# Build Mappite 
Edit `make.sh` to set keys (See `001-Keys.js`) 

Run:

    ./make.sh php prod 

to create the dist/ directory (wwwroot) with all files and mappite.js minimized

Run:

    ./make.sh

to create the dist/ directory (wwwroot) without php and mappite.js not minimized - which is what you usually want when developing change on main javascript files.

## Php&Database

This is needed to generate shorturls and for cloud management (login, save routes, etc) .

Create mysql database using `./sql/tables.sql`
running mappite with no php&database is still possible but some cleanup is needed to remove references to ".php" from `mappite.js`

## Web Server Setup
 Optional - needed for short urls 
 
 Apache `.htaccess` file to copy in wwwroot
   - adds www. prefix to url (if missed)
   - forces httpS
   - redirects short urls to su.php page

    RewriteEngine On
    RewriteCond %{HTTP_HOST} !^$
    RewriteCond %{HTTP_HOST} !^www\. [NC]
    RewriteRule ^ https://www.%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
    RewriteCond %{HTTPS} off 
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/beta/Default.htm$
    RewriteCond %{REQUEST_URI} !^/Default.htm$
    RewriteRule ^(.+)$ /beta/su.php?s=$1 [L]

replace "beta" with proper subfolder used for testing changes
