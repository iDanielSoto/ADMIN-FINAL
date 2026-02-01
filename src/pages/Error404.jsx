const Error404 = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md text-center">
                <div className="flex gap-4 text-6xl mb-4">
                    <h1>Error 404</h1>
                    <img src="https://tenor.com/es-419/view/where-gif-13643959220571097395.gif" alt="" />
                </div>
                <p className="text-gray-600 mb-6">
                    La página que buscas no existe.
                </p>
                <a href="/" className="btn-primary">
                    Volver al inicio
                </a>
            </div>
        </div>
    )
}

export default Error404;