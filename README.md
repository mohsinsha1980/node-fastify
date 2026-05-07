GET
http://localhost:3100/api

POST
http://localhost:3100/api/auth/register
{email: string, password: string}

POST
http://localhost:3100/api/auth/login
{email: string, password: string}

GET
http://localhost:3100/api/auth/logout
{email: string, password: string}
