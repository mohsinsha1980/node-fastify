GET
http://localhost:3100/

POST
http://localhost:3100/auth/register
{email: string, password: string}

POST
http://localhost:3100/auth/login
{email: string, password: string}

GET
http://localhost:3100/auth/logout
{email: string, password: string}
