import logging
import urllib.parse
import urllib.error
import http.client
import json
import auth

class DatasetServiceAPIException(Exception):
    def __init__(self, message: str, error_code: int = 0):
        super().__init__(message)
        self.error_code = error_code

class DatasetServiceAPIClient:
    def __init__(self, authClient: auth.AuthClient, apiURL: str):
        self.apiURL = urllib.parse.urlparse(apiURL)
        if self.apiURL.hostname is None: raise Exception('Wrong apiUrl.')
        self.authClient = authClient
        
    def _get_connection(self):
        if self.apiURL.hostname is None: raise Exception('Wrong apiUrl.')
        return http.client.HTTPSConnection(self.apiURL.hostname, self.apiURL.port)
    
    def _get_headers(self):
        headers = {}
        headers['Authorization'] = 'bearer ' + self.authClient.get_token()
        return headers

    def _PUT_JSON(self, path, content):
        connection = self._get_connection()
        headers = self._get_headers()
        headers['Content-Type'] = 'application/json'
        try:
            connection.request("PUT", self.apiURL.path + path, json.dumps(content), headers)
            res = connection.getresponse()
            httpStatusCode = res.status
            msg = res.read()  # whole response must be readed in order to do more requests using the same connection
        finally:
            connection.close()
        if httpStatusCode != 201:
            logging.root.error('DatasetServiceAPI error. Code: %d %s' % (httpStatusCode, res.reason))
            raise DatasetServiceAPIException('Internal server error: DatasetServiceAPI call failed.', httpStatusCode)
        logging.root.debug('DatasetServiceAPI call success.')
    
    def createOrUpdateSubproject(self, projectCode, subprojectCode, name, description, externalId):
        logging.root.debug('Putting the subproject with DatasetServiceAPI...')
        self._PUT_JSON("projects/"+projectCode+"/subprojects/"+subprojectCode, {
            "name": name,
            "description": description,
            "externalId": externalId
        })

