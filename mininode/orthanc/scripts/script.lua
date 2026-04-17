local cipher = require("openssl.cipher")
local hmac = require("openssl.hmac")
local mime = require("mime")


function encrypt(plaintext, master_key)

    local k_enc = hmac.new(master_key, "sha256"):final("enc_key")
    local k_mac = hmac.new(master_key, "sha256"):final("mac_key")
    local k_iv  = hmac.new(master_key, "sha256"):final("iv_key")

    local iv = hmac.new(k_iv, "sha256"):final(plaintext):sub(1, 16)
    local aes = cipher.new("AES-256-CBC")
    aes:encrypt(k_enc, iv)
    local ciphertext = aes:update(plaintext) .. aes:final()

    local h = hmac.new(k_mac, "sha256")
    local signature = h:final(iv .. ciphertext)

    return signature .. iv .. ciphertext

end


function remove_dead_links()

    local command = "find /var/lib/orthanc/storage_link -mindepth 1 -depth -xtype l -delete -o -type d -empty -delete"
    local success = os.execute(command)

    if not success then
       print("Error removing dead symbolic links")
    end

end


function OnStableStudy(studyOrthancID, tags, metadata)

   local study = ParseJson(RestApiGet('/studies/' .. studyOrthancID))
   local studyID = study['MainDicomTags']['StudyID']
   local patientOrthancID = study['ParentPatient']
   local patientID = study['PatientMainDicomTags']['PatientID']
   local patientName = study['PatientMainDicomTags']['PatientName']
   local patientMetadata = ParseJson(RestApiGet('/patients/' .. patientOrthancID .. '/metadata?expand'))

   if patientMetadata['patientID-encrypted'] == "true" then
      print("⚪ On Stable Study")
      print("   UID Estudio: " .. tags['StudyInstanceUID'])
      print("   ID Estudio (interno): " .. studyOrthancID)
      print("   Nombre Paciente: " .. patientName)
      print("   ID Paciente: " .. patientID)
      print("   ID Paciente (interno): " .. patientOrthancID)
      print("   ---> Ya encriptado")
      return
   end

   local masterKey = os.getenv("PATIENT_ID_ENCRYPTION_KEY")
   local encryptedPatientID = mime.b64(encrypt(patientID, masterKey)):gsub("/", "_"):gsub("%+", "-"):gsub("%s", "")

   local modification = {
      ['Replace'] = {
         ['PatientID'] = encryptedPatientID
      },
      ["Keep"] = { 
        "StudyInstanceUID", 
        "SeriesInstanceUID",
        "SOPInstanceUID" 
      },
      ['Force'] = true,
      ['KeepSource'] = false,
   }

   local modifiedDicom = RestApiPost('/patients/' .. patientOrthancID .. '/modify', DumpJson(modification))

   local newPatientOrthancID = ParseJson(modifiedDicom)['ID']
 
   RestApiPut("/patients/" .. newPatientOrthancID .. "/metadata/patientID-encrypted", "true")

   print("⚪ On Stable Study")
   print("   UID Estudio: " .. tags['StudyInstanceUID'])
   print("   ID Estudio (interno): " .. studyOrthancID)
   print("   Nombre Paciente: " .. patientName)
   print("   ID Paciente: " .. patientID)
   print("   ID Paciente (interno): " .. patientOrthancID)   
   print("   ---> ")
   print("   ID Paciente: " .. encryptedPatientID)
   print("   ID Paciente (interno): " .. newPatientOrthancID)

   remove_dead_links()

end


function OnDeletedStudy(studyOrthancID)

   print("🔴 On Deleted Study: " .. studyOrthancID)

   remove_dead_links()  

end


function OnDeletedPatient(patientOrthancID)   print("🔴 On Deleted Patient: " .. patientOrthancID)    end
function OnDeletedSeries(seriesOrthancID)     print("🔴 On Deleted Series: " .. seriesOrthancID)      end
function OnDeletedInstance(instanceOrthancID) print("🔴 On Deleted Instance: " .. instanceOrthancID)  end


function OnUpdatedPatient(patientOrthancID)
   local patientData = ParseJson(RestApiGet("/patients/" .. patientOrthancID))
   local patientID = patientData['MainDicomTags']['PatientID']
   print("🔵 On Update Patient")
   print("   ID Paciente: " .. patientID)
end

function OnUpdatedStudy(studyOrthancID)
   local studyData = ParseJson(RestApiGet("/studies/" .. studyOrthancID))
   local studyUID = studyData['MainDicomTags']['StudyInstanceUID']
   local patientID = studyData['PatientMainDicomTags']['PatientID']
   print("🔵 On Updated Study")
   print("   UID Estudio: " .. studyUID)
   print("   ID Paciente: " .. patientID)
end

function OnUpdatedSeries(seriesOrthancID)
   local seriesData = ParseJson(RestApiGet("/series/" .. seriesOrthancID))
   if seriesData == nil then return end
   local seriesUID = seriesData['MainDicomTags']['SeriesInstanceUID']
   local studyOrthancID  = seriesData['ParentStudy']
   local studyData = ParseJson(RestApiGet("/studies/" .. studyOrthancID))
   local studyUID  = studyData['MainDicomTags']['StudyInstanceUID']
   local patientID = studyData['PatientMainDicomTags']['PatientID']
   print("🔵 On Updated Series")
   print("   UID Serie :  " .. seriesUID)
   print("   UID Estudio: " .. studyUID)
   print("   ID Paciente: " .. patientID)
end

function OnUpdatedInstance(instanceOrthancID) 
   local instanceData = ParseJson(RestApiGet("/instances/" .. instanceOrthancID))
   local sopInstanceUID = instanceData['MainDicomTags']['SOPInstanceUID']
   local seriesOrthancID = instanceData['ParentSeries']
   local seriesData = ParseJson(RestApiGet("/series/" .. seriesOrthancID))
   local seriesUID = seriesData['MainDicomTags']['SeriesInstanceUID']
   local studyOrthancID  = seriesData['ParentStudy']
   local studyData = ParseJson(RestApiGet("/studies/" .. studyOrthancID))
   local studyUID  = studyData['MainDicomTags']['StudyInstanceUID']
   local patientID = studyData['PatientMainDicomTags']['PatientID']
   print("🔵 On Update Instance")
   print("   UID Elemento: " .. sopInstanceUID)
   print("   UID Serie:    " .. seriesUID)
   print("   UID Estudio:  " .. studyUID)
   print("   ID Paciente:  " .. patientID)
end


function OnStablePatient(patientId, tags, metadata)
   print("⚪ On Stable Patient")
   print("   ID Paciente: " .. tags['PatientID'])
end

function OnStableSeries(seriesId, tags, metadata)
  print("⚪ On Stable Series")
  print("   UID Serie: " .. tags['SeriesInstanceUID'])
end


function ReceivedInstanceFilter(dicom, origin, info) 
   print("🟡 Received Instance Filter")
   --PrintRecursive(dicom)
   print("   UID Elemento: " .. dicom['SOPInstanceUID'])
   print("   UID Serie:    " .. dicom['SeriesInstanceUID'])
   print("   UID Estudio:  " .. dicom['StudyInstanceUID'])
   print("   ID Paciente:  " .. dicom['PatientID'])
   return true
end

function OnStoredInstance(instanceId, tags, metadata, origin) 
   print("🟢 On Stored Instance") 
   print("   UID Elemento: " .. tags['SOPInstanceUID'])
   print("   UID Serie:    " .. tags['SeriesInstanceUID'])
   print("   UID Estudio:  " .. tags['StudyInstanceUID'])
   print("   ID Paciente:  " .. tags['PatientID'])
end

