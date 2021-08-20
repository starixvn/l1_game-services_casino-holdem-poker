import { loadLanguage } from '../languages';
import Indo from '../id-ID';
import Eng from '../en-US';

describe('language test', () => {
  it('should return expected with language id', async () => {
    // Arrange
    const language = 'id-ID';

    // Act
    const actual = await loadLanguage(language);

    // Assert
    expect(actual).toStrictEqual(Indo);
  });

  it('should return expected with default language', async () => {
    // Act
    const actual = await loadLanguage();

    // Assert
    expect(actual).toStrictEqual(Eng);
  });
});
