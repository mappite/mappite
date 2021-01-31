# Build Mappite 
Edit [make.sh](make.sh) to set keys (see [001-Keys.js](mappite-js/001-Keys.js)) and database connections (see [db.php](php/db.php). 

Run:

    ./make.sh

to create the `dist/` directory (wwwroot) without php and mappite.js not minimized - which is what you usually want when developing changes on main javascript files.

Run:

    ./make.sh php prod 

to create the `dist/` directory (wwwroot) with all files and mappite.js minimized (requires nodejs uglify-js).

## Database & Php
 _Optional_ This is needed to generate shorturls, for cloud management (login, save routes, etc) and to cache route results - the latter happens when the first user follows an existing link to a mappite URL (see proxy-cache page [pc.php](php/pc.php)).

Create mysql database using `./sql/tables.sql`

It is possible to run mappite with no database&php but some cleanup is needed to disable/hide references to ".php" from `mappite.js`

## Web Server Setup
_Optional_ needed for short urls (hide/coment links in Share panel if not used)
 
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
