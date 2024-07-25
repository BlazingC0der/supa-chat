import "./file-list.css"
import FileIcon from "./assets/doc.jpg"
import { decryptMessage } from "./utils/decrypt"

const FileList = (props) => {
    return (
        <div className="file-list">
            {props.files.map((file) => {
                const filename = decryptMessage(file.filename)
                const extension = filename.substr(filename.indexOf(".") + 1).toUpperCase()
                return (
                    <div className="file-chip" key={file.id}>
                        <div className="file-data">
                            <img
                                src={FileIcon}
                                style={{ width: "30px", height: "30px" }}
                                alt="file icon"
                            />
                            <div>
                                <h5 style={{ margin: 0 }}>{filename}</h5>
                                <span
                                    style={{
                                        color: "rgb(153, 153, 153)",
                                        fontSize: "14px"
                                    }}
                                >{`${extension}   ${file.size}`}</span>
                            </div>
                        </div>
                        <a href={file.file} download target="_blank">
                            <button className="download-file-btn">
                                <span className="material-symbols-outlined">
                                    download
                                </span>
                            </button>
                        </a>
                    </div>
                )
            })}
        </div>
    )
}

export default FileList
