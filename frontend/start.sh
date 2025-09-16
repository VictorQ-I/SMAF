#!/bin/sh

# Reemplazar variables de entorno en tiempo de ejecución
if [ ! -z "$REACT_APP_API_URL" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_API_URL_PLACEHOLDER|$REACT_APP_API_URL|g" {} \;
fi

if [ ! -z "$REACT_APP_ENVIRONMENT" ]; then
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_ENVIRONMENT_PLACEHOLDER|$REACT_APP_ENVIRONMENT|g" {} \;
fi

# Iniciar nginx
nginx -g "daemon off;"




