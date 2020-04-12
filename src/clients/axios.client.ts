import axios from 'axios';
import * as rax from 'retry-axios';

const axiosInstance = axios.create();

rax.attach(axiosInstance);

export default axiosInstance;

