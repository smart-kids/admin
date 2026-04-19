import React from "react";
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ErrorMessage from "../components/error-toast";

// --- Draft.js and react-draft-wysiwyg Imports ---
import { EditorState, ContentState } from 'draft-js';
import { Editor } from "react-draft-wysiwyg";
import { stateToHTML } from 'draft-js-export-html';
import htmlToDraft from 'html-to-draftjs';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { contentTypes } from "./add";

// --- Data, Utils, and Components ---
import Data from "../../../utils/data";
import imageCompression from 'browser-image-compression';
import AddOptionModal from "../options/add";
import EditOptionModal from "../options/edit";
import DeleteOptionModal from "../options/delete";
import Table from "../components/table";
import Search from "../components/search";

// --- Global Dependencies ---
const toastr = window.toastr;
const $ = window.$;
const IErrorMessage = new ErrorMessage();



// --- Constants ---
const modalId = `modal-edit-content-${Math.random().toString().split(".")[1]}`;
const generateId = (prefix = 'item') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;


const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  url = url.trim();
  let videoId = null;
  const watchMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
  if (watchMatch && watchMatch[2].length === 11) videoId = watchMatch[2];
  if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  if (url.includes("youtube.com/embed/")) {
    const embedIdMatch = url.match(/embed\/([^#\&\?]+)/);
    if (embedIdMatch && embedIdMatch[1].length === 11) return url;
  }
  return null;
};

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});


class EditQuestionModal extends React.Component {
  addOptionModalRef = React.createRef();
  editOptionModalRef = React.createRef();
  deleteOptionModalRef = React.createRef();
  formRef = React.createRef();
  imageFileInputRef = React.createRef();
  attachmentFileInputRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  getInitialState = () => ({
    loading: false,
    isCompressingImages: false,
    contentBlocks: [],
    questionType: 'SINGLECHOICE',
    questionId: null,
    subtopic: "",
    createdQuestionId: null,
    addedOptions: [],
    optionToEdit: null,
    optionToDelete: null,
    optionSearchTerm: '',
    videoUrlsInput: "",
    attachments: [],
  });

  componentDidMount() {
    $(this.formRef.current).validate({
      errorClass: "invalid-feedback", errorElement: "div",
      highlight: (el) => $(el).addClass("is-invalid"),
      unhighlight: (el) => $(el).removeClass("is-invalid"),
      ignore: ":hidden:not(select)",
    });
    $(`#${modalId}`).on(`hidden.bs.modal.${modalId}`, this.handleModalClose);
    this.initializeFromProps(this.props.question);
  }

  // --- Replace it with this corrected version ---
  componentDidUpdate(prevProps) {
    // Rely on prop changes from the parent, rather than state ID mismatch, to re-initialize safely
    if (this.props.question && prevProps.question && this.props.question.id !== prevProps.question.id) {
        this.initializeFromProps(this.props.question);
    }
  }

// onPropsChange = (prevProps) => {
//   if (this.props.question && this.props.question.id && this.props.question.id != this.state.questionId) {
//     this.initializeFromProps(this.props.question);
//   }
// }

  componentWillUnmount() {
    $(`#${modalId}`).off(`.modal.${modalId}`);
    if ($(this.formRef.current).data('validator')) {
      $(this.formRef.current).data('validator').destroy();
    }
  }

  handleModalClose = () => {
    this.resetState();
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  show = () => {
    this.initializeFromProps(this.props.question);
    $(`#${modalId}`).modal({ show: true, backdrop: "static", keyboard: false });
  };
  hide = () => $(`#${modalId}`).modal("hide");

  resetState = () => {
    (this.state.contentBlocks || []).forEach(block => {
      if (block.type === 'IMAGE' && !block.isExisting && block.preview) {
        URL.revokeObjectURL(block.preview);
      }
    });
    this.setState(this.getInitialState());
  }

  initializeFromProps = async (question) => {
    // console.log("initializeFromProps", question)
    if (!question) return this.resetState();
    this.setState({ loading: true });

    let questionImages = [];
    if (question.id) {
        try {
            questionImages = await Data.questions.getImages(question.id);
        } catch (error) {
            console.error("Error fetching question images:", error);
        }
    }

    const contentOrder = question.contentOrder || [];
    const reconstructedBlocks = [];

    if (contentOrder.length > 0) {
        let imageIndex = 0;
      contentOrder.forEach(item => {
        if (item.type === 'TEXT') {
          const blocksFromHtml = htmlToDraft(question.name || '');
          const { contentBlocks, entityMap } = blocksFromHtml;
          const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
          reconstructedBlocks.push({
            id: generateId('text'), type: 'TEXT',
            editorState: EditorState.createWithContent(contentState),
          });
        } else if (item.type === 'IMAGE') {
          const imgUrl = questionImages[imageIndex];
          imageIndex++;
          if (imgUrl) {
            reconstructedBlocks.push({
              id: item.id || generateId('image'), type: 'IMAGE', name: 'Existing Image',
              preview: imgUrl, isExisting: true,
            });
          }
        } else if (item.type === 'VIDEO') {
          const videoData = (question.videos || []).find(vid => vid.id === item.id);
          if (videoData) {
            reconstructedBlocks.push({
              id: videoData.id, type: 'VIDEO', embedUrl: videoData.embedUrl,
              originalUrl: videoData.embedUrl, isExisting: true,
            });
          }
        }
      });
    } else {
      const blocksFromHtml = htmlToDraft(question.name || '');
      reconstructedBlocks.push({
        id: generateId('text'), type: 'TEXT',
        editorState: EditorState.createWithContent(ContentState.createFromBlockArray(blocksFromHtml.contentBlocks, blocksFromHtml.entityMap))
      });
      (questionImages || []).forEach(imgUrl => reconstructedBlocks.push({ id: generateId('image'), type: 'IMAGE', name: 'Legacy Image', preview: imgUrl, isExisting: true }));
      (question.videos || []).forEach(vidUrl => reconstructedBlocks.push({ id: generateId('video'), type: 'VIDEO', embedUrl: vidUrl, isExisting: true }));
    }

    this.setState({
      contentBlocks: reconstructedBlocks,
      questionId: question.id,
      createdQuestionId: question.id,
      questionType: question.type || 'SINGLECHOICE',
      subtopic: question.subtopic,
      addedOptions: question.options || [],
      attachments: (question.attachments || []).map(att => ({ ...att, id: generateId('attachment'), isExisting: true })),
      loading: false,
    });
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    if (!$(this.formRef.current).valid()) return;

    const textBlock = this.state.contentBlocks.find(b => b.type === 'TEXT');
    if (!textBlock || !textBlock.editorState.getCurrentContent().hasText()) {
      IErrorMessage.show({ message: "Content description cannot be empty." });
      return;
    }
    this.setState({ loading: true });

    try {
      let htmlContent = "";
      const images = [];
      const videos = [];
      const contentOrder = [];

      for (const block of this.state.contentBlocks) {
        switch (block.type) {
          case 'TEXT':
            htmlContent = stateToHTML(block.editorState.getCurrentContent());
            contentOrder.push({ type: 'TEXT' });
            break;
          case 'IMAGE':
            const imageData = block.isExisting ?
              { id: block.id, name: block.name, url: block.preview } :
              { id: block.id, name: block.name, base64: await toBase64(block.data) };
            images.push(imageData);
            contentOrder.push({ type: 'IMAGE', id: block.id });
            break;
          case 'VIDEO':
            videos.push({ id: block.id, embedUrl: block.embedUrl });
            contentOrder.push({ type: 'VIDEO', id: block.id });
            break;
          default: break;
        }
      }

      const serializedAttachments = await Promise.all(
        this.state.attachments.map(async (att) => {
          return att.isExisting ?
            { name: att.name, url: att.url } :
            { name: att.file.name, base64: await toBase64(att.file) };
        })
      );

      const payload = {
        id: this.state.questionId,
        name: htmlContent,
        subtopic: this.state.subtopic,
        type: this.state.questionType,
        videos: videos.map(v => v.embedUrl),
        images: images.map(i => i.url || i.base64),
        attachments: serializedAttachments.map(a => a.url),
        contentOrder: contentOrder,
      };

      await this.props.edit(payload);
      // toastr.success("Content has been updated successfully!");
      this.setState({ loading: false });
      this.hide();

    } catch (error) {
      this.setState({ loading: false });
      IErrorMessage.show({ message: error?.response?.data?.message || "Error saving content." });
    }
  }

  onEditorStateChange = (editorState) => {
    this.setState(prevState => ({
      contentBlocks: prevState.contentBlocks.map(block =>
        block.type === 'TEXT' ? { ...block, editorState } : block
      )
    }));
  };
  handleTypeChange = (event) => this.setState({ questionType: event.target.value });
  handleVideoUrlsInputChange = (event) => this.setState({ videoUrlsInput: event.target.value });
  handleAddVideoUrls = () => {
    const urls = this.state.videoUrlsInput.split('\n').map(url => url.trim()).filter(Boolean);
    if (!urls.length) return;
    const newVideoBlocks = urls.map(originalUrl => {
      const embedUrl = getYoutubeEmbedUrl(originalUrl);
      return embedUrl ? { id: generateId('video'), type: 'VIDEO', embedUrl, originalUrl, isExisting: false } : null;
    }).filter(Boolean);
    if (newVideoBlocks.length > 0) {
      this.setState(prevState => ({
        contentBlocks: [...prevState.contentBlocks, ...newVideoBlocks],
        videoUrlsInput: ""
      }));
    }
  };
  handleImageFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    this.setState({ isCompressingImages: true });
    const imageBlockPromises = files.map(file =>
      imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1024 })
        .then(compressedFile => ({
          id: generateId('image'), type: 'IMAGE', name: compressedFile.name, data: compressedFile,
          preview: URL.createObjectURL(compressedFile), isExisting: false,
        })).catch(error => { console.error("Error compressing image:", error); return null; })
    );
    const newImageBlocks = (await Promise.all(imageBlockPromises)).filter(Boolean);
    if (newImageBlocks.length > 0) {
      this.setState(prevState => ({ contentBlocks: [...prevState.contentBlocks, ...newImageBlocks] }));
    }
    this.setState({ isCompressingImages: false });
    // event.target.value = null;
  };
  removeContentBlock = (idToRemove) => {
    this.setState(prevState => {
      const blockToRemove = prevState.contentBlocks.find(b => b.id === idToRemove);
      if (blockToRemove?.type === 'IMAGE' && !blockToRemove.isExisting && blockToRemove.preview) {
        URL.revokeObjectURL(blockToRemove.preview);
      }
      return { contentBlocks: prevState.contentBlocks.filter(b => b.id !== idToRemove) };
    });
  };
  onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    const reorderedBlocks = Array.from(this.state.contentBlocks);
    const [removed] = reorderedBlocks.splice(source.index, 1);
    reorderedBlocks.splice(destination.index, 0, removed);
    this.setState({ contentBlocks: reorderedBlocks });
  };
  onOptionSearch = (e) => this.setState({ optionSearchTerm: e.target.value });
  handleCreateOption = async (data) => {
    const newOption = await Data.options.create({ ...data, question: this.state.questionId });
    this.setState(prevState => ({ addedOptions: [...prevState.addedOptions, newOption] }));
  };
  handleUpdateOption = async (data) => {
    await Data.options.update({ ...data, id: this.state.optionToEdit.id });
    this.setState(prevState => ({
      addedOptions: prevState.addedOptions.map(o => o.id === data.id ? {...o, ...data} : o),
      optionToEdit: null,
    }));
  };
  handleDeleteOption = async () => {
    await Data.options.delete({ id: this.state.optionToDelete.id, question: this.state.questionId });
    this.setState(prevState => ({
      addedOptions: prevState.addedOptions.filter(o => o.id !== prevState.optionToDelete.id),
      optionToDelete: null,
    }));
  };
  handleOptionOrderChange = (reorderedOptions) => {
    this.setState({ addedOptions: reorderedOptions });
    Data.questions.update({ id: this.state.questionId, optionsOrder: reorderedOptions.map(o => o.id) });
  };
  renderContentBlock = (block) => {
    switch (block.type) {
      case 'TEXT': return <div dangerouslySetInnerHTML={{ __html: stateToHTML(block.editorState.getCurrentContent()) }} />;
      case 'IMAGE': return <img src={block.preview} alt="preview" className="img-fluid rounded" />;
      case 'VIDEO': return <div className="embed-responsive embed-responsive-16by9"><iframe src={block.embedUrl} className="embed-responsive-item" allowFullScreen title="YouTube Preview" /></div>;
      default: return null;
    }
  };

  render() {
    console.log(this.state)
    const { contentBlocks, questionType, loading, isCompressingImages, addedOptions, optionSearchTerm, questionId } = this.state;
    if (!questionId) return null;

    const isSaveDisabled = loading || isCompressingImages;
    const showOptionsSection = contentTypes.find(ct => ct.value === questionType)?.hasOptions;
    const filteredOptions = (addedOptions || []).filter(opt => (opt.value || '').toLowerCase().includes(optionSearchTerm.toLowerCase()));
    const correctOptionIds = (addedOptions || []).filter(o => o.correct).map(o => o.id);
    const textBlock = contentBlocks.find(b => b.type === 'TEXT');

    return (
      <div>
        <style>{`.modal-xl { max-width: 1200px; } .rdw-editor-main { min-height: 150px; border: 1px solid #E4E6EF; border-radius: 0.42rem; padding: 0.75rem 1rem; } .preview-block { position: relative; padding: 1rem; margin-bottom: 1rem; background-color: #ffffff; border: 1px dashed #E4E6EF; border-radius: 0.42rem; } .preview-block:hover { border-color: var(--primary); } .drag-handle { position: absolute; top: 10px; left: -15px; background: var(--primary); color: white; width: 30px; height: 30px; border-radius: 50%; cursor: grab; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s; } .preview-block:hover .drag-handle { opacity: 1; } .remove-block-btn { position: absolute; top: 8px; right: 8px; z-index: 10; }`}</style>
        <div className="modal fade" id={modalId} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <form ref={this.formRef} onSubmit={this.handleSubmit} noValidate>
                <div className="modal-header">
                  <h4 className="modal-title">Edit Content</h4>
                  <button type="button" className="close" onClick={this.hide} disabled={isSaveDisabled}>×</button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    {/* --- Left Column: Form Inputs --- */}
                    <div className="col-md-7">
                      <div className="form-group">
                        <label className="font-weight-bold text-dark">Content Type <span className="text-danger">*</span></label>
                        <select className="form-control form-control-solid" value={questionType} onChange={this.handleTypeChange} required>
                          {contentTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                      </div>

                      {textBlock && (
                        <div className="form-group mb-8">
                           <label className="font-weight-bold text-dark">Content Description <span className="text-danger">*</span></label>
                           <Editor editorState={textBlock.editorState} onEditorStateChange={this.onEditorStateChange} wrapperClassName="rdw-editor-wrapper bg-white rounded" editorClassName="rdw-editor-main" />
                        </div>
                       )}

                      <div className="card card-custom gutter-b">
                        <div className="card-header">
                          <div className="card-title"><h3 className="card-label">Add Content Blocks</h3></div>
                        </div>
                        <div className="card-body">
                          <div className="form-group">
                            <label className="font-weight-bold">Add Videos (YouTube)</label>
                            <textarea className="form-control form-control-solid" rows="2" placeholder="Paste one or more YouTube URLs, each on a new line." value={this.state.videoUrlsInput} onChange={this.handleVideoUrlsInputChange} />
                            <button type="button" className="btn btn-sm btn-light-primary font-weight-bold mt-2" onClick={this.handleAddVideoUrls}>Add Videos</button>
                          </div>
                          <hr/>
                          <div className="form-group">
                            <label className="font-weight-bold">Add Images {isCompressingImages && <span className="text-primary font-weight-normal">(Processing...)</span>}</label>
                            <input type="file" multiple accept="image/*" ref={this.imageFileInputRef} onChange={this.handleImageFileSelect} style={{ display: 'none' }} />
                            <button type="button" className="btn btn-light-info btn-block font-weight-bold" onClick={() => this.imageFileInputRef.current.click()}>
                              <i className="fa fa-image mr-2"></i>Click to Add Images from Device
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* --- Right Column: Live Preview and Options --- */}
                    <div className="col-md-5">
                      <div className="card card-custom gutter-b">
                        <div className="card-header">
                          <div className="card-title"><h3 className="card-label">Live Content Preview</h3></div>
                        </div>
                        <div className="card-body bg-light">
                          <p className="text-muted text-center small">Drag and drop content blocks to reorder</p>
                          <DragDropContext onDragEnd={this.onDragEnd}>
                            <Droppable droppableId="content-blocks">
                              {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                  {contentBlocks.map((block, index) => (
                                    <Draggable key={block.id} draggableId={block.id} index={index}>
                                      {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} className="preview-block">
                                          <div {...provided.dragHandleProps} className="drag-handle"><i className="fas fa-grip-vertical"></i></div>
                                          {block.type !== 'TEXT' && (<button type="button" className="btn btn-xs btn-icon btn-light-danger remove-block-btn" onClick={() => this.removeContentBlock(block.id)}><i className="fa fa-times"></i></button>)}
                                          {this.renderContentBlock(block)}
                                        </div>
                                    )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </DragDropContext>
                        </div>
                      </div>

                      {showOptionsSection && (
                        <div className="card card-custom">
                           <div className="card-header">
                            <div className="card-title"><h3 className="card-label">Responses</h3></div>
                            <div className="card-toolbar">
                                <button type="button" className="btn btn-primary btn-sm font-weight-bold" onClick={() => this.addOptionModalRef.current.show()}>
                                  <i className="fa fa-plus"></i> Add Response
                                </button>
                            </div>
                           </div>
                           <div className="card-body">
                             <Search title="responses" onSearch={this.onOptionSearch} value={optionSearchTerm} />
                             <Table listId={`options-list-${questionId}`} headers={[{ label: "Answer", key: "value" }]} data={filteredOptions} options={{ reorderable: true, editable: true, deleteable: true }} edit={opt => this.setState({ optionToEdit: opt }, () => this.editOptionModalRef.current.show())} delete={opt => this.setState({ optionToDelete: opt }, () => this.deleteOptionModalRef.current.show())} onOrderChange={this.handleOptionOrderChange} correctItemIds={correctOptionIds} />
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light-primary font-weight-bold" onClick={this.hide} disabled={isSaveDisabled}>Cancel</button>
                  <button type="submit" className="btn btn-primary font-weight-bold" style={{ minWidth: '120px' }} disabled={isSaveDisabled}>
                    {isSaveDisabled ? <span className="spinner-border spinner-border-sm" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <AddOptionModal ref={this.addOptionModalRef} save={this.handleCreateOption} />
        {this.state.optionToEdit && <EditOptionModal ref={this.editOptionModalRef} option={this.state.optionToEdit} edit={this.handleUpdateOption} />}
        {this.state.optionToDelete && <DeleteOptionModal ref={this.deleteOptionModalRef} option={this.state.optionToDelete} delete={this.handleDeleteOption} />}
      </div>
    );
  }
}

EditQuestionModal.propTypes = {
  question: PropTypes.object,
  subtopic: PropTypes.string,
  edit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EditQuestionModal;