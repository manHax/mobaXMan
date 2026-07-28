import keytar from 'keytar';

const SERVICE_NAME = 'mobaXMan';

export class CredentialStore {
  /**
   * Simpan kredensial (password atau passphrase) dengan aman menggunakan OS keychain.
   * Format accountName: `${sessionId}-password` atau `${sessionId}-passphrase`
   */
  async setPassword(sessionId: string, secret: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, `${sessionId}-password`, secret);
  }

  async getPassword(sessionId: string): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, `${sessionId}-password`);
  }

  async deletePassword(sessionId: string): Promise<boolean> {
    return await keytar.deletePassword(SERVICE_NAME, `${sessionId}-password`);
  }

  async setPassphrase(sessionId: string, secret: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, `${sessionId}-passphrase`, secret);
  }

  async getPassphrase(sessionId: string): Promise<string | null> {
    return await keytar.getPassword(SERVICE_NAME, `${sessionId}-passphrase`);
  }

  async deletePassphrase(sessionId: string): Promise<boolean> {
    return await keytar.deletePassword(SERVICE_NAME, `${sessionId}-passphrase`);
  }
  
  async deleteAllCredentials(sessionId: string): Promise<void> {
    await this.deletePassword(sessionId);
    await this.deletePassphrase(sessionId);
  }
}
