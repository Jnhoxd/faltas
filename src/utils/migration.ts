import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function migrateExistingData() {
  try {
    const batch = writeBatch(db);
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);

    // Update all existing students to be associated with Patos de Minas
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.unit) {
        batch.update(doc.ref, {
          unit: 'Patos de Minas'
        });
      }
    });

    // Commit all updates
    await batch.commit();
    console.log('Migração concluída com sucesso');
  } catch (error) {
    console.error('Erro na migração:', error);
    throw error;
  }
}