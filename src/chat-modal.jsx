import { Box, Button, Modal, Typography, Container } from "@mui/material"
import { styled } from "@mui/system"
import Searchbar from "./searchbar"
import { useRef, useState } from "react"
import "./chat-modal.css"
import UserList from "./chat-list"

const StyledModal = styled(Modal)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
})

const ModalContent = styled(Box)({
    backgroundColor: "white",
    borderRadius: "15px",
    padding: "30px",
    width: window.innerWidth <= 850 ? "90%" : "50%",
    height: window.innerWidth <= 850 ? "60%" : "90%",
    overflowY: "auto",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)"
})

const ModalHeading = styled(Typography)({
    marginBottom: "2px",
    fontWeight: "bolder"
})

const ModalSubheading = styled(Typography)({
    marginBottom: "20px",
    color: "#858585",
    fontWeight: 500
})

const ScrollableContainer = styled(Container)({
    overflowY: "auto",
    marginTop: "25px",
    padding: "0 !important"
})

const createBtnStyle = {
    marginTop: "25px",
    borderRadius: "5px",
    backgroundColor: "#2563eb",
    padding: "10px 0",
    textTransform: "initial"
}

const ChatModal = (props) => {
    const [searchedUsers, setSearchedUsers] = useState([])
    const [groupMembers, setGroupMembers] = useState([])
    const groupName = useRef("")

    const handleClose = () => props.openModal(false)

    const handleGroupCreation = () => {
        props.createGroup(groupMembers, groupName.current)
        setGroupMembers([])
        groupName.current = ""
        handleClose()
    }

    return (
        <div>
            <StyledModal open={props.open} onClose={handleClose}>
                <ModalContent>
                    <ModalHeading variant="h6">
                        {props.newChat ? "Start New Chat" : "Create New Group"}
                    </ModalHeading>
                    <ModalSubheading variant="subtitle1">
                        {props.newChat
                            ? "Select a user to start chatting with them"
                            : "Add users to create a new group"}
                    </ModalSubheading>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexDirection: "column",
                            width: "100%",
                            rowGap: "10px"
                        }}
                    >
                        {!props.newChat && (
                            <input
                                type="text"
                                className="group-name"
                                name="group-name"
                                id="group-name"
                                placeholder="group name"
                                onChange={(e) =>
                                    (groupName.current = e.target.value)
                                }
                            />
                        )}
                        <Searchbar
                            setSearchedChats={setSearchedUsers}
                            width={"100%"}
                        />
                    </Box>
                    <ScrollableContainer
                        sx={{ maxHeight: props.newChat ? "280px" : "200px" }}
                    >
                        <UserList
                            users={searchedUsers}
                            mutateMembers={setGroupMembers}
                            selectionMode
                            checkBoxSelection={!props.newChat}
                            selectChat={props.selectChat}
                            closeModal={handleClose}
                        />
                    </ScrollableContainer>
                    {!props.newChat && (
                        <Button
                            fullWidth
                            sx={createBtnStyle}
                            variant="contained"
                            onClick={handleGroupCreation}
                            disabled={
                                !groupMembers.length || !groupName.current
                            }
                        >
                            Create Group
                        </Button>
                    )}
                </ModalContent>
            </StyledModal>
        </div>
    )
}

export default ChatModal
