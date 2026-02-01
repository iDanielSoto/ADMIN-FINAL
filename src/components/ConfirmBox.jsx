function ConfirmBox({ message, onConfirm, onCancel }) {
    return (
        <div className="overlay">
            <div className="box">
                <p>{message}</p>
                {onCancel ? (
                    <>
                        <button onClick={onConfirm}>Sí</button>
                        <button onClick={onCancel}>Cancelar</button>
                    </>
                ) : (
                    <button onClick={onConfirm}>OK</button>
                )}
            </div>
        </div>
    );
}

export default ConfirmBox;