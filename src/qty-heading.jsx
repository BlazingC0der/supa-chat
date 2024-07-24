import "./qty-heading.css"

const QtyHeading = (props) => {
    return (
        <div
            style={{ display: "flex", alignItems: "center", columnGap: "5px" }}
        >
            {props.size === "large" ? (
                <h4 className="qty-heading">{props.headingText}</h4>
            ) : (
                <h5 className="qty-heading">{props.headingText}</h5>
            )}
            <span className="qty">{props.qty}</span>
        </div>
    )
}

export default QtyHeading
