import axios from 'axios'
import './login.css'
import { API } from "../../utils/requests"

    export const clientId='552182325809-sig4legggt7h8k0mpqhlfs2qb4v1f14d.apps.googleusercontent.com'
    export const onLoginSuccess = (res) => {
        console.log('Login Success:', res.profileObj)
        axios({            
            method:'POST',
            url:`${API}/googlelogin`,
            data:{tokenId: res.tokenId}
        }).then(res => console.log(res))
    };

    export const onLoginFailure = (res) => {
        console.log('Login Failed:', res);
    };

    export const responseFacebook = (response) => {
        console.log(response)
        axios({            
            method:'POST',
            url:`${API}/facebookLogin`,
            data:{acesstoken: response.acesstoken,
            userID: response.userID}
        }).then(res => console.log("Here is the response", res));
      }
    export const componentClicked= () => console.log('Button Clicked')

