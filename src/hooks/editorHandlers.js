import { supabase } from '../supabaseClient';
import imageCompression from 'browser-image-compression'; // 라이브러리 임포트

export const createImageHandler = (quillRef, folderName = 'editor') => {
  return () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        // --- 이미지 압축 및 WebP 변환 설정 ---
        const options = {
          maxSizeMB: 1,            // 최대 용량 1MB
          maxWidthOrHeight: 1280,  // 최대 가로/세로 길이
          useWebWorker: true,
          fileType: 'image/webp'   // WebP 형식으로 강제 변환
        };

        // 실제 압축 실행
        const compressedFile = await imageCompression(file, options);
        // ------------------------------------

        // 파일명 생성 (.webp 확장자로 변경)
        const safeFileName = file.name.replace(/[^\x00-\x7F]/g, "").split('.')[0];
        const fileName = `${folderName}/${Date.now()}_${safeFileName}.webp`;
        
        const BUCKET_NAME = 'daonrs';

        // 압축된 파일(compressedFile)을 업로드
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);
        
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', publicUrl);
        quill.setSelection(range.index + 1);
        
      } catch (error) {
        console.error('이미지 압축 및 업로드 오류:', error);
        alert('이미지 처리 실패: ' + error.message);
      }
    };
  };
};

export const createVideoHandler = (quillRef) => {
  return () => {
    const url = prompt('유튜브 또는 동영상 URL을 입력하세요:');
    if (!url) return;

    let videoUrl = url;
    // 유튜브 일반, 쇼츠, 단축 URL인 경우 embed용 주소로 파싱
    const youtubeReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeReg);
    if (match && match[1]) {
      videoUrl = `https://www.youtube.com/embed/${match[1]}`;
    }

    try {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'video', videoUrl);
      quill.setSelection(range.index + 1);
    } catch (e) {
      console.error('비디오 삽입 실패:', e);
    }
  };
};

export const getEditorModules = (imageHandler, videoHandler) => ({
  toolbar: {
    container: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['image', 'link', 'video'],
      ['clean']
    ],
    handlers: {
      image: imageHandler,
      ...(videoHandler && { video: videoHandler })
    }
  }
});

export const convertYoutubeLinksToIframes = (htmlContent) => {
  if (!htmlContent) return '';
  
  // 1. <a href="..."> 형태로 들어가 있는 유튜브 링크를 iframe으로 변환
  const youtubeAhrefRegex = /<a\s+[^>]*href=["'](https?:\/\/(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11}))["'][^>]*>.*?<\/a>/g;
  
  let result = htmlContent.replace(youtubeAhrefRegex, (match, fullUrl, videoId) => {
    const safeIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    if (!safeIdRegex.test(videoId)) return match;
    return `<iframe class="ql-video" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen="true"></iframe>`;
  });

  // 2. DOMParser를 이용하여 기존 HTML 구조(<img> 태그 등)를 완벽히 보존한 채 순수 텍스트 영역의 링크만 변환
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(result, 'text/html');
    
    const walkTextNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|shorts\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11}))/g;
        
        if (urlRegex.test(text)) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text.replace(urlRegex, (m, fUrl, vId) => {
            return `<iframe class="ql-video" src="https://www.youtube.com/embed/${vId}" frameborder="0" allowfullscreen="true"></iframe>`;
          });
          
          const frag = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            frag.appendChild(tempDiv.firstChild);
          }
          node.parentNode.replaceChild(frag, node);
        }
      } else {
        if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
          for (let i = 0; i < node.childNodes.length; i++) {
            walkTextNodes(node.childNodes[i]);
          }
        }
      }
    };

    walkTextNodes(doc.body);
    return doc.body.innerHTML;
  } catch (e) {
    console.error('유튜브 링크 파싱 중 오류:', e);
    return result;
  }
};