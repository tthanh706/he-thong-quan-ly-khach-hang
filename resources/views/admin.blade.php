<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Admin</title>
</head>
<body>

    <h1>Chào mừng Admin!</h1>

    <form action="/logout" method="POST">
        @csrf
        <button type="submit">Đăng xuất</button>
    </form>

</body>
</html>