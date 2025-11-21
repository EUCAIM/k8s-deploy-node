import logging
import urllib.parse
import urllib.error
import http.client
import json
import auth

class QPInsightsAdminAPIException(Exception):
    def __init__(self, message: str, error_code: int = 0):
        super().__init__(message)
        self.error_code = error_code

class QPInsightsAdminAPIClient:
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

    def _GET_JSON(self, path):
        connection = self._get_connection()
        try:
            connection.request("GET", self.apiURL.path + path, body="", headers=self._get_headers())
            res = connection.getresponse()
            httpStatusCode = res.status
            msg = res.read()  # whole response must be readed in order to do more requests using the same connection
        finally:
            connection.close()
        if httpStatusCode != 200:
            logging.root.error('QPInsightsAdminAPI error. Code: %d %s' % (httpStatusCode, res.reason))
            raise QPInsightsAdminAPIException('Internal server error: QPInsightsAdminAPI call failed.', httpStatusCode)
        logging.root.debug('QPInsightsAdminAPI call success.')
        return json.loads(msg)

    def _POST_JSON(self, path, content):
        connection = self._get_connection()
        headers = self._get_headers()
        headers['Content-Type'] = 'application/json'
        try:
            connection.request("POST", self.apiURL.path + path, json.dumps(content), headers)
            res = connection.getresponse()
            httpStatusCode = res.status
            msg = res.read()  # whole response must be readed in order to do more requests using the same connection
        finally:
            connection.close()
        if httpStatusCode != 201:
            logging.root.error('QPInsightsAdminAPI error. Code: %d %s' % (httpStatusCode, res.reason))
            raise QPInsightsAdminAPIException('Internal server error: QPInsightsAdminAPI call failed.', httpStatusCode)
        logging.root.debug('QPInsightsAdminAPI call success.')
        return json.loads(msg)
    
    def _PATCH_JSON(self, path, content):
        connection = self._get_connection()
        headers = self._get_headers()
        headers['Content-Type'] = 'application/json'
        try:
            connection.request("PATCH", self.apiURL.path + path, json.dumps(content), headers)
            res = connection.getresponse()
            httpStatusCode = res.status
            msg = res.read()  # whole response must be readed in order to do more requests using the same connection
        finally:
            connection.close()
        if httpStatusCode != 200:
            logging.root.error('QPInsightsAdminAPI error. Code: %d %s' % (httpStatusCode, res.reason))
            raise QPInsightsAdminAPIException('Internal server error: QPInsightsAdminAPI call failed.', httpStatusCode)
        logging.root.debug('QPInsightsAdminAPI call success.')
        return json.loads(msg)

    def createOrUpdateSite(self, code, name, country, representative_name, representative_email, representative_phone):
        logging.root.debug('Getting sites from QPInsightsAdminAPI...')
        sites = self._GET_JSON("sites")
        site = None
        for s in sites:
            if s["siteId"] == code:
                site = s
        if site is None:
            logging.root.debug('Creating the new site with QPInsightsAdminAPI...')
            result = self._POST_JSON("sites", {
                "name": name,
                "siteId": code,
                "country": country,
                "representativeName": representative_name,
                "representativeEmail": representative_email,
                "representativePhone": representative_phone
            })
        else:
            logging.root.debug('Updating the existing site with QPInsightsAdminAPI...')
            result = self._PATCH_JSON("sites/"+site["id"], {
                "country": country,
                "representativeName": representative_name,
                "representativeEmail": representative_email,
                "representativePhone": representative_phone
            })
        return result["siteId"]
    
    def getSiteId(self, site_code):
        logging.root.debug('Getting site from QPInsightsAdminAPI...')
        sites = self._GET_JSON("sites")
        for s in sites:
            if s["siteId"] == site_code:
                return s["id"]
        return None
    
    def getProjectsIds(self, projects_codes):
        logging.root.debug('Getting projects from QPInsightsAdminAPI...')
        projects = self._GET_JSON("projects")
        subprojects_ids = []
        for code in projects_codes:
            for p in projects:
                pCode = str(p["code"])
                if pCode.startswith(code + "|") or pCode == code:
                    subprojects_ids.append(p["id"])
        return subprojects_ids

    def createOrUpdateUser(self, user_email, user_name, user_site_id, user_position, user_projects_ids):
        logging.root.debug('Getting users from QPInsightsAdminAPI...')
        users = self._GET_JSON("users")
        user = None
        for u in users:
            if u["upn"] == user_email:
                user = u
        if user is None:
            logging.root.debug('Creating the new user with QPInsightsAdminAPI...')
            data = { "upn": user_email,
                     "name": user_name,
                     "site": user_site_id,
                     "position": user_position,
                     "projects": user_projects_ids,
                     "acceptedTermsAndConditions": True }
            logging.root.debug('Data: ' + json.dumps(data))
            self._POST_JSON("users", data)
        else:        
            logging.root.debug('Updating the existing user with QPInsightsAdminAPI...')
            data = { "name": user_name,
                     "site": user_site_id,
                     "position": user_position,
                     "projects": user_projects_ids }
            logging.root.debug('Data: ' + json.dumps(data))
            self._PATCH_JSON("users/"+user["id"], data)

    def createOrUpdateProject(self, code, name, description):
        logging.root.debug('Getting projects from QPInsightsAdminAPI...')
        projects = self._GET_JSON("projects")
        project = None
        for p in projects:
            if p["code"] == code:
                project = p
        if project is None:
            logging.root.debug('Creating the new project with QPInsightsAdminAPI...')
            result = self._POST_JSON("projects", {
                "name": name,
                "code": code,
                "description": description,
                "timepoints": [{"order":0, "value":"Diagnosis"}]
            })
            return result
        else:
            logging.root.debug('Updating the existing project with QPInsightsAdminAPI...')
            result = self._PATCH_JSON("projects/"+project["id"], {
                "description": description,
                "timepoints": project["timepoints"]
            })
            return result["_id"]

