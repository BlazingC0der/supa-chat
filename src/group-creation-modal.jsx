import { Box, Button, Modal, Typography, Container } from "@mui/material"
import { styled } from "@mui/system"
import Searchbar from "./searchbar"
import { useRef, useState } from "react"
import "./group-creation-modal.css"
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
    width: "50%",
    height: "90%",
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
    maxHeight: "200px",
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
const GroupModal = (props) => {
    const handleClose = () => props.openModal(false)
    const [searchedUsers, setSearchedUsers] = useState([])
    const [groupMembers, setGroupMembers] = useState([])
    const groupName = useRef("")

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
                    <ModalHeading variant="h6">Create New Group</ModalHeading>
                    <ModalSubheading variant="subtitle1">
                        Add users to create a new group
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
                        <Searchbar
                            setSearchedChats={setSearchedUsers}
                            width={"100%"}
                        />
                    </Box>
                    <ScrollableContainer>
                        <UserList
                            users={searchedUsers}
                            mutateMembers={setGroupMembers}
                        />
                    </ScrollableContainer>
                    <Button
                        fullWidth
                        sx={createBtnStyle}
                        variant="contained"
                        onClick={handleGroupCreation}
                        disabled={!groupMembers.length || !groupName.current}
                    >
                        Create Group
                    </Button>
                </ModalContent>
            </StyledModal>
        </div>
    )
}

export default GroupModal
