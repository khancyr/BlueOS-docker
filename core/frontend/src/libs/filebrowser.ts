import notifications from '@/store/notifications'
import { FilebrowserCredentials, FilebrowserFile, FilebrowserFolder } from '@/types/filebrowser'
import { filebrowser_service } from '@/types/frontend_services'
import back_axios, { backend_offline_error } from '@/utils/api'

const filebrowser_url = '/file-browser/api'
const filebrowser_credentials: FilebrowserCredentials = { username: '', password: '', recaptcha: '' }

class Filebrowser {
  auth_token: string | null

  constructor() {
    this.auth_token = null
    this.updateFilebrowserToken()
  }

  /* Fetch filebrowser API for a authentication token and store it.
     This method should be called on constructor so other methods have a token to use. */
  async updateFilebrowserToken(): Promise<void> {
    await back_axios({
      method: 'post',
      url: `${filebrowser_url}/login`,
      timeout: 10000,
      data: filebrowser_credentials,
    })
      .then((response) => {
        this.auth_token = response.data
      })
      .catch((error) => {
        const error_message = `Could not authenticate to filebrowser API: ${error.message}`
        const message = error_message
        notifications.pushError({ service: filebrowser_service, type: 'FILEBROWSER_AUTH_FAIL', message })
        throw new Error(error)
      })
  }

  /* Helper to get the auth token, checking before if it was set. */
  async filebrowserToken(): Promise<string> {
    if (this.auth_token === null) {
      await this.updateFilebrowserToken()
      if (this.auth_token === null) {
        throw new Error('Authentication token not set.')
      }
    }
    return this.auth_token
  }

  /* Fetch a folder from filebrowser. */
  /**
   * @param folder_path - String absolute path of folder to be fetched
   * @returns FilebrowserFolder object
  * */
  async fetchFolder(folder_path: string): Promise<FilebrowserFolder> {
    return back_axios({
      method: 'get',
      url: `${filebrowser_url}/resources${folder_path}`,
      timeout: 10000,
      headers: { 'X-Auth': await this.filebrowserToken() },
    })
      .then((response) => response.data)
      .catch((error) => {
        if (error === backend_offline_error) { return }
        const error_message = `Could not fetch folder ${folder_path}: ${error.message}`
        const message = error_message
        notifications.pushError({ service: filebrowser_service, type: 'FOLDER_FETCH_FAIL', message })
        throw new Error(error_message)
      })
  }

  /* Delete a single file. */
  /* Register a notification and throws if delete fails. */
  /**
   * @param file - FilebrowserFile object to be deleted
  * */
  async deleteFile(file: FilebrowserFile): Promise<void> {
    back_axios({
      method: 'delete',
      url: `/file-browser/api/resources${file.path}`,
      timeout: 10000,
      headers: { 'X-Auth': await this.filebrowserToken() },
    })
      .catch((error) => {
        const error_message = `Could not delete file ${file.path}: ${error.message}`
        const message = error_message
        notifications.pushError({ service: filebrowser_service, type: 'FILE_DELETE_FAIL', message })
        throw new Error(error_message)
      })
  }

  /* Performs multiple-file delete requests. */
  /* Will perform all possible delete operations and reject if any of them fails. */
  /**
   * @param files - FilebrowserFile objects to be deleted
  * */
  async deleteFiles(files: FilebrowserFile[]): Promise<void> {
    const delete_promises: Promise<void>[] = []
    files.forEach((file) => {
      delete_promises.push(this.deleteFile(file))
    })
    await Promise.all(delete_promises)
  }

  /* Returns the relative URL (without hostname) of a single file. */
  /**
   * @param file - FilebrowserFile object
  * */
  async singleFileRelativeURL(file: FilebrowserFile): Promise<string> {
    return `${filebrowser_url}/raw${file.path}?auth=${await this.filebrowserToken()}`
  }

  /* Returns the relative URL (without hostname) of a zip of multiple files. */
  /**
   * @param files - FilebrowserFile objects
  * */
  async multipleFilesRelativeURL(files: FilebrowserFile[]): Promise<string> {
    const files_arg = files.map((file) => file.path).join(',')
    return `${filebrowser_url}/raw/?files=${files_arg}&algo=zip&auth=${await this.filebrowserToken()}`
  }

  /* Download files (single or multiple). */
  /**
   * @param files - FilebrowserFile objects array
  * */
  async downloadFiles(files: FilebrowserFile[]): Promise<void> {
    let url = ''
    if (files.length === 1) {
      url = await this.singleFileRelativeURL(files[0])
    } else {
      url = await this.multipleFilesRelativeURL(files)
    }
    window.open(url)
  }
}

const filebrowser = new Filebrowser()

export default filebrowser
