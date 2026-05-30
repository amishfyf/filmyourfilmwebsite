const axios = require('axios');
const Project = require('../models/Project');

const VIMEO_OEMBED_URL = 'https://vimeo.com/api/oembed.json';
const GRID_STYLES = new Set(['full', 'half-top', 'half-bottom']);
const DIRECT_VIDEO_PATTERN = /\.(mp4|webm|ogg|mov|m4v)(?:$|[?#])/i;

const repairWebsiteFilesCdnUrl = (url) => {
  try {
    const parsedUrl = new URL(String(url).trim());
    const pathname = parsedUrl.pathname.replace(/^\//, '');
    const malformedMatch = pathname.match(/^([a-f0-9]{24})([a-f0-9]{24}_.+\.(?:mp4|webm|ogg|mov|m4v))$/i);

    if (!malformedMatch || parsedUrl.hostname !== 'cdn.prod.website-files.com') {
      return parsedUrl.toString();
    }

    return `${parsedUrl.origin}/${malformedMatch[1]}%2F${malformedMatch[2]}${parsedUrl.search}${parsedUrl.hash}`;
  } catch (error) {
    return '';
  }
};

const extractVimeoId = (value = '') => {
  const input = String(value).trim();

  if (!input) {
    return null;
  }

  if (/^\d+$/.test(input)) {
    return input;
  }

  const directMatch = input.match(/(?:video\/|vimeo\.com\/)(\d{6,12})/i);

  if (directMatch) {
    return directMatch[1];
  }

  try {
    const parsedUrl = new URL(input);

    if (!/(^|\.)vimeo\.com$/i.test(parsedUrl.hostname)) {
      return null;
    }

    const pathMatch = parsedUrl.pathname.match(/(\d{6,12})/);
    return pathMatch ? pathMatch[1] : null;
  } catch (error) {
    return null;
  }
};

const normalizeOrder = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 1) {
    return null;
  }

  return numericValue;
};

const normalizeGridStyle = (value) => {
  const normalizedValue = String(value || 'full').trim().toLowerCase();
  return GRID_STYLES.has(normalizedValue) ? normalizedValue : null;
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  const str = String(value).trim().toLowerCase();
  if (str === 'true' || str === '1') return true;
  if (str === 'false' || str === '0' || str === '') return false;
  return undefined;
};

const normalizeUrl = (value = '') => {
  try {
    return repairWebsiteFilesCdnUrl(new URL(String(value).trim()).toString());
  } catch (error) {
    return '';
  }
};

const isCloudinaryUrl = (value = '') => {
  return /res\.cloudinary\.com\/.+\/video\/upload/i.test(String(value));
};

const isDirectVideoUrl = (value = '') => {
  const normalizedUrl = normalizeUrl(value);

  if (!normalizedUrl) {
    return false;
  }

  if (isCloudinaryUrl(normalizedUrl)) {
    return true;
  }

  return DIRECT_VIDEO_PATTERN.test(new URL(normalizedUrl).pathname);
};

const deriveTitleFromUrl = (value = '') => {
  const normalizedUrl = normalizeUrl(value);

  if (!normalizedUrl) {
    return 'Untitled Video';
  }

  const { pathname } = new URL(normalizedUrl);
  const filename = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || 'untitled-video');
  const withoutExtension = filename.replace(/\.[a-z0-9]+$/i, '');
  const cleanedTitle = withoutExtension.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleanedTitle) {
    return 'Untitled Video';
  }

  return cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
};

const buildVimeoUrl = ({ vimeoUrl, vimeoId }) => {
  if (vimeoUrl && String(vimeoUrl).trim()) {
    return normalizeUrl(vimeoUrl);
  }

  return `https://vimeo.com/${vimeoId}`;
};

const resolveSourceInput = ({ videoUrl, vimeoUrl, vimeoId }) => {
  const candidateUrl = normalizeUrl(videoUrl || vimeoUrl);
  const resolvedVimeoId = extractVimeoId(vimeoId || candidateUrl);

  if (resolvedVimeoId) {
    return {
      sourceType: 'vimeo',
      vimeoId: resolvedVimeoId,
      videoUrl: buildVimeoUrl({ vimeoUrl: candidateUrl, vimeoId: resolvedVimeoId }),
    };
  }

  if (candidateUrl) {
    return {
      sourceType: isDirectVideoUrl(candidateUrl) ? 'direct' : 'external',
      videoUrl: candidateUrl,
      vimeoId: null,
    };
  }

  return null;
};

const resolveProjectOrder = async (requestedOrder) => {
  if (requestedOrder) {
    await Project.updateMany({ order: { $gte: requestedOrder } }, { $inc: { order: 1 } });
    return requestedOrder;
  }

  const highestOrderedProject = await Project.findOne()
    .sort({ order: -1, createdAt: -1 })
    .select('order')
    .lean();

  return Number.isInteger(highestOrderedProject?.order) ? highestOrderedProject.order + 1 : 1;
};

const createProject = async (req, res, next) => {
  try {
    const {
      vimeoUrl,
      videoUrl,
      vimeoId: rawVimeoId,
      order,
      gridStyle,
      title: customTitle,
      thumbnailUrl: customThumbnailUrl,
      isAi: rawIsAi,
    } = req.body;
    const sourceInput = resolveSourceInput({
      videoUrl,
      vimeoUrl,
      vimeoId: rawVimeoId,
    });
    const resolvedGridStyle = normalizeGridStyle(gridStyle);
    const requestedOrder = normalizeOrder(order);

    if (!sourceInput) {
      return res.status(400).json({
        message: 'Provide a valid URL or a numeric Vimeo ID.',
      });
    }

    if (requestedOrder === null) {
      return res.status(400).json({
        message: 'order must be a positive integer when provided.',
      });
    }

    if (!resolvedGridStyle) {
      return res.status(400).json({
        message: 'gridStyle must be one of: full, half-top, half-bottom.',
      });
    }

    const duplicateQuery = sourceInput.sourceType === 'vimeo'
      ? {
          $or: [
            { sourceType: 'vimeo', vimeoId: sourceInput.vimeoId },
            { videoUrl: sourceInput.videoUrl },
          ],
        }
      : { videoUrl: sourceInput.videoUrl };

    const existingProject = await Project.findOne(duplicateQuery).select('_id').lean();

    if (existingProject) {
      return res.status(409).json({
        message: 'That video already exists in the portfolio.',
      });
    }

    let projectPayload;

    if (sourceInput.sourceType === 'vimeo') {
      let oEmbedData = null;

      try {
        const response = await axios.get(VIMEO_OEMBED_URL, {
          params: {
            url: sourceInput.videoUrl,
          },
          timeout: 10000,
        });
        oEmbedData = response.data;
      } catch (error) {
        oEmbedData = null;
      }

      projectPayload = {
        title: customTitle?.trim() || oEmbedData?.title || deriveTitleFromUrl(sourceInput.videoUrl),
        sourceType: 'vimeo',
        videoUrl: sourceInput.videoUrl,
        vimeoId: String(oEmbedData?.video_id || sourceInput.vimeoId),
        thumbnailUrl: customThumbnailUrl?.trim() || oEmbedData?.thumbnail_url || '',
      };
    } else {
      projectPayload = {
        title: customTitle?.trim() || deriveTitleFromUrl(sourceInput.videoUrl),
        sourceType: sourceInput.sourceType,
        videoUrl: sourceInput.videoUrl,
        vimeoId: undefined,
        thumbnailUrl: customThumbnailUrl?.trim() || '',
      };
    }

    const assignedOrder = await resolveProjectOrder(requestedOrder);

    const project = await Project.create({
      ...projectPayload,
      order: assignedOrder,
      gridStyle: resolvedGridStyle,
      isAi: normalizeBoolean(rawIsAi) === true,
    });

    return res.status(201).json(project);
  } catch (error) {
    if (error.code === 11000 || error?.message?.includes('duplicate key')) {
      return res.status(409).json({
        message: 'That video already exists in the portfolio.',
      });
    }

    return next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
};

const reorderProjects = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({
        message: 'Provide a non-empty items array to update project order.',
      });
    }

    const seenIds = new Set();
    const operations = items.map((item, index) => {
      const id = String(item.id || '').trim();

      if (!id) {
        throw new Error('Each reordered item must include a valid id.');
      }

      if (seenIds.has(id)) {
        throw new Error('Duplicate project ids are not allowed in the reorder payload.');
      }

      seenIds.add(id);

      const nextGridStyle = normalizeGridStyle(item.gridStyle);

      if (!nextGridStyle) {
        throw new Error('Each reordered item must include a valid gridStyle value.');
      }

      return {
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              order: index + 1,
              gridStyle: nextGridStyle,
            },
          },
        },
      };
    });

    await Project.bulkWrite(operations);

    const projects = await Project.find()
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return res.status(200).json(projects);
  } catch (error) {
    if (error.message.includes('valid id') || error.message.includes('Duplicate') || error.message.includes('gridStyle')) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({ message: 'Provide a valid project id.' });
    }

    const {
      title: rawTitle,
      thumbnailUrl: rawThumbnailUrl,
      gridStyle: rawGridStyle,
      videoUrl: rawVideoUrl,
      vimeoId: rawVimeoId,
      vimeoUrl: rawVimeoUrl,
      isAi: rawIsAi,
    } = req.body;

    const update = {};

    if (rawTitle !== undefined) {
      update.title = String(rawTitle || '').trim();
    }

    if (rawThumbnailUrl !== undefined) {
      update.thumbnailUrl = String(rawThumbnailUrl || '').trim();
    }

    if (rawGridStyle !== undefined) {
      const normalized = normalizeGridStyle(rawGridStyle);
      if (!normalized) {
        return res.status(400).json({ message: 'gridStyle must be one of: full, half-top, half-bottom.' });
      }
      update.gridStyle = normalized;
    }

    if (rawIsAi !== undefined) {
      const normalized = normalizeBoolean(rawIsAi);
      if (normalized !== undefined) update.isAi = normalized;
    }

    if (rawVideoUrl !== undefined || rawVimeoId !== undefined || rawVimeoUrl !== undefined) {
      const sourceInput = resolveSourceInput({ videoUrl: rawVideoUrl, vimeoUrl: rawVimeoUrl, vimeoId: rawVimeoId });

      if (!sourceInput) {
        return res.status(400).json({ message: 'Provide a valid URL or a numeric Vimeo ID.' });
      }

      const duplicateQuery = sourceInput.sourceType === 'vimeo'
        ? {
            $or: [
              { sourceType: 'vimeo', vimeoId: sourceInput.vimeoId },
              { videoUrl: sourceInput.videoUrl },
            ],
          }
        : { videoUrl: sourceInput.videoUrl };

      const existingProject = await Project.findOne({
        ...duplicateQuery,
        _id: { $ne: id },
      }).select('_id').lean();

      if (existingProject) {
        return res.status(409).json({ message: 'That video already exists in the portfolio.' });
      }

      update.sourceType = sourceInput.sourceType;
      update.videoUrl = sourceInput.videoUrl;
      update.vimeoId = sourceInput.vimeoId || undefined;

      if (sourceInput.sourceType === 'vimeo') {
        let oEmbedData = null;

        try {
          const response = await axios.get(VIMEO_OEMBED_URL, {
            params: { url: sourceInput.videoUrl },
            timeout: 10000,
          });
          oEmbedData = response.data;
        } catch (error) {
          oEmbedData = null;
        }

        if (!update.title) update.title = oEmbedData?.title || deriveTitleFromUrl(sourceInput.videoUrl);
        if (!update.thumbnailUrl) update.thumbnailUrl = oEmbedData?.thumbnail_url || '';
      } else {
        if (!update.title) update.title = deriveTitleFromUrl(sourceInput.videoUrl);
      }
    }

    const project = await Project.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    return res.status(200).json(project);
  } catch (error) {
    if (error.code === 11000 || error?.message?.includes('duplicate key')) {
      return res.status(409).json({ message: 'That video already exists in the portfolio.' });
    }

    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const id = String(req.params.id || '').trim();

    if (!id) {
      return res.status(400).json({ message: 'Provide a valid project id.' });
    }

    const project = await Project.findById(id).select('order').lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    await Project.findByIdAndDelete(id);

    if (Number.isInteger(project.order)) {
      await Project.updateMany({ order: { $gt: project.order } }, { $inc: { order: -1 } });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  reorderProjects,
  updateProject,
  deleteProject,
};
