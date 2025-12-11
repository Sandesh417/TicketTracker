const Ticket = require('../models/Ticket');
const path = require('path');
const fs = require('fs');

exports.createTicket = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => {
        return {
          filename: file.originalname,
          storedFilename: file.filename,
          path: `/api/uploads/temp/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
      });
    }

    const data = {
      title: req.body.title || '',
      requestorName: req.body.requestorName || '',
      mobileNumber: req.body.mobileNumber || '',
      projectId: req.body.projectId ? Number(req.body.projectId) : null,
      plantId: req.body.plantId ? Number(req.body.plantId) : null,
      shopId: req.body.shopId ? Number(req.body.shopId) : null,
      lineId: req.body.lineId ? Number(req.body.lineId) : null,
      machine: req.body.machine || '',
      explanation: req.body.explanation || '',
      drfLink: req.body.drfLink || '',
      azureLink: req.body.azureLink || '',
      attachments,
      remark: req.body.remark || '',
      status: 'created',
      assignedTo: null,
      assignedDate: null,
      adminReview: 0
    };

    const ticket = await Ticket.create(data);
    res.status(201).json({
      success: true,
      data: ticket,
      attachments: ticket.attachments || []
    });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Could not create ticket', details: err.message || err });
  }
};

exports.uploadAttachments = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const ticket = await Ticket.getByTicketNumber(ticketNumber);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newAttachments = req.files.map(file => ({
      filename: file.originalname,
      storedFilename: file.filename,
      path: `/api/uploads/${ticketNumber}/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    const existingAttachments = ticket.attachments || [];
    const allAttachments = [...existingAttachments, ...newAttachments];

    await Ticket.update(ticketNumber, { attachments: allAttachments });

    res.status(201).json({
      success: true,
      attachments: newAttachments,
      allAttachments: allAttachments
    });
  } catch (err) {
    console.error('Upload attachments error:', err);
    res.status(500).json({ error: 'Attachment upload failed', details: err.message || err });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.getAll({ search: req.query.search || '' });
    const ticketsWithAttachments = tickets.map(ticket => {
      const history = ticket.history || [];
      
      console.log('Raw history for ticket', ticket.ticketNumber, ':', JSON.stringify(history, null, 2));
      
      const historyWithAttachments = history.map(comment => {
        console.log('Processing comment:', comment.id, 'Raw attachments:', comment.attachments, 'Type:', typeof comment.attachments);
        
        let parsedAttachments = [];
        
        if (typeof comment.attachments === 'string') {
          try {
            parsedAttachments = JSON.parse(comment.attachments);
            console.log('Parsed string attachments:', parsedAttachments);
          } catch (e) {
            console.error('Failed to parse attachments for comment:', comment.id, e);
            parsedAttachments = [];
          }
        } else if (Array.isArray(comment.attachments)) {
          parsedAttachments = comment.attachments;
          console.log('Already array attachments:', parsedAttachments);
        } else if (comment.attachments && typeof comment.attachments === 'object') {
          parsedAttachments = [comment.attachments];
          console.log('Object converted to array:', parsedAttachments);
        }
        
        return {
          ...comment,
          attachments: parsedAttachments
        };
      });

      return {
        ...ticket,
        attachments: ticket.attachments || [],
        history: historyWithAttachments
      };
    });
    res.json({
      success: true,
      data: ticketsWithAttachments,
      count: ticketsWithAttachments.length
    });
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ error: 'Could not fetch tickets', details: err.message || err });
  }
};

exports.getSingleTicket = async (req, res) => {
  try {
    const ticket = await Ticket.getByTicketNumber(req.params.ticketNumber);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    console.log('Raw ticket data:', JSON.stringify(ticket, null, 2));
    
    const history = ticket.history || [];
    const historyWithAttachments = history.map(comment => {
      console.log('Processing comment:', comment.id, 'Raw attachments:', comment.attachments, 'Type:', typeof comment.attachments);
      
      let parsedAttachments = [];
      
      if (typeof comment.attachments === 'string') {
        try {
          parsedAttachments = JSON.parse(comment.attachments);
        } catch (e) {
          console.error('Failed to parse attachments:', e);
          parsedAttachments = [];
        }
      } else if (Array.isArray(comment.attachments)) {
        parsedAttachments = comment.attachments;
      } else if (comment.attachments && typeof comment.attachments === 'object') {
        parsedAttachments = [comment.attachments];
      }
      
      return {
        ...comment,
        attachments: parsedAttachments
      };
    });

    const ticketWithAttachments = {
      ...ticket,
      attachments: ticket.attachments || [],
      history: historyWithAttachments
    };
    
    res.json({
      success: true,
      data: ticketWithAttachments
    });
  } catch (err) {
    console.error('Get single ticket error:', err);
    res.status(500).json({ error: 'Could not fetch ticket', details: err.message || err });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const updateData = {};

    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.requestorName !== undefined) updateData.requestorName = req.body.requestorName;
    if (req.body.mobileNumber !== undefined) updateData.mobileNumber = req.body.mobileNumber;
    if (req.body.projectId !== undefined) updateData.projectId = Number(req.body.projectId);
    if (req.body.plantId !== undefined) updateData.plantId = Number(req.body.plantId);
    if (req.body.shopId !== undefined) updateData.shopId = req.body.shopId ? Number(req.body.shopId) : null;
    if (req.body.lineId !== undefined) updateData.lineId = req.body.lineId ? Number(req.body.lineId) : null;
    if (req.body.machine !== undefined) updateData.machine = req.body.machine;
    if (req.body.explanation !== undefined) updateData.explanation = req.body.explanation;
    if (req.body.drfLink !== undefined) updateData.drfLink = req.body.drfLink;
    if (req.body.azureLink !== undefined) updateData.azureLink = req.body.azureLink;
    if (req.body.remark !== undefined) updateData.remark = req.body.remark;
    if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo;
    if (req.body.assignedDate !== undefined) updateData.assignedDate = req.body.assignedDate;

    if (req.body.status) {
      updateData.status = req.body.status;
      if (req.body.status === 'done') {
        updateData.adminReview = 1;
      } else if (req.body.status === 'closed') {
        updateData.adminReview = 0;
        updateData.closedAt = new Date().toISOString();
      } else if (req.body.status === 'created') {
        updateData.adminReview = 0;
      }
    }

    const success = await Ticket.update(req.params.ticketNumber, updateData);
    if (!success) {
      return res.status(404).json({ error: 'Ticket not found or nothing to update' });
    }

    const updatedTicket = await Ticket.getByTicketNumber(req.params.ticketNumber);
    res.json({
      success: true,
      data: {
        ...updatedTicket,
        attachments: updatedTicket.attachments || []
      }
    });
  } catch (err) {
    console.error('Update ticket error:', err);
    res.status(500).json({ error: 'Could not update ticket', details: err.message || err });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const success = await Ticket.delete(req.params.ticketNumber);
    if (!success) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ 
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (err) {
    console.error('Delete ticket error:', err);
    res.status(500).json({ error: 'Could not delete ticket', details: err.message || err });
  }
};

exports.getTicketHistory = async (req, res) => {
  try {
    const ticket = await Ticket.getByTicketNumber(req.params.ticketNumber);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    console.log('Raw ticket history:', JSON.stringify(ticket.history, null, 2));

    const history = ticket.history || [];
    const commentsWithAttachments = history.map(comment => {
      console.log('Comment ID:', comment.id);
      console.log('Raw attachments value:', comment.attachments);
      console.log('Attachments type:', typeof comment.attachments);
      console.log('All comment fields:', Object.keys(comment));
      
      let parsedAttachments = [];
      
      if (typeof comment.attachments === 'string') {
        try {
          parsedAttachments = JSON.parse(comment.attachments);
          console.log('Successfully parsed string to:', parsedAttachments);
        } catch (e) {
          console.error('Failed to parse attachments for comment:', comment.id, 'Error:', e.message);
          console.error('Raw string was:', comment.attachments);
          parsedAttachments = [];
        }
      } else if (Array.isArray(comment.attachments)) {
        parsedAttachments = comment.attachments;
        console.log('Already an array:', parsedAttachments);
      } else if (comment.attachments && typeof comment.attachments === 'object') {
        parsedAttachments = [comment.attachments];
        console.log('Converted object to array:', parsedAttachments);
      } else {
        console.log('Attachments is null, undefined, or unrecognized type');
      }
      
      return {
        ...comment,
        attachments: parsedAttachments
      };
    });

    res.json({
      success: true,
      data: {
        comments: commentsWithAttachments,
        remark: ticket.remark || '',
        title: ticket.title || '',
        drfLink: ticket.drfLink || '',
        azureLink: ticket.azureLink || '',
        ticketAttachments: ticket.attachments || []
      }
    });
  } catch (err) {
    console.error('Get ticket history error:', err);
    res.status(500).json({ error: 'Could not fetch history', details: err.message || err });
  }
};

exports.addHistoryComment = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const text = req.body.text || '';
    const userName = req.body.userName || 'Unknown';

    if (!text.trim() && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'Comment text or attachments required' });
    }

    let commentAttachments = [];
    if (req.files && req.files.length > 0) {
      commentAttachments = req.files.map(file => ({
        filename: file.originalname,
        storedFilename: file.filename,
        path: `/api/uploads/comments/${ticketNumber}/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }));
    }

    console.log('Adding comment with attachments:', commentAttachments);

    const comment = await Ticket.addHistoryComment(
      ticketNumber,
      text.trim(),
      userName,
      commentAttachments
    );

    console.log('Comment returned from model:', comment);

    const responseComment = {
      ...comment,
      attachments: Array.isArray(comment.attachments) ? comment.attachments : commentAttachments
    };

    res.status(201).json({
      success: true,
      data: responseComment
    });
  } catch (err) {
    console.error('Add history comment error:', err);
    res.status(500).json({ error: 'Could not add comment', details: err.message || err });
  }
};

exports.editHistoryComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text, userName } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'New comment text required' });
    }
    await Ticket.editHistoryComment(
      req.params.ticketNumber,
      Number(commentId),
      text.trim(),
      userName || 'Unknown'
    );

    const ticket = await Ticket.getByTicketNumber(req.params.ticketNumber);
    const updatedComment = (ticket.history || []).find(c => c.id === Number(commentId));

    if (updatedComment && typeof updatedComment.attachments === 'string') {
      try {
        updatedComment.attachments = JSON.parse(updatedComment.attachments);
      } catch (e) {
        updatedComment.attachments = [];
      }
    }

    res.json({
      success: true,
      data: {
        ...updatedComment,
        attachments: updatedComment?.attachments || []
      }
    });
  } catch (err) {
    console.error('Edit history comment error:', err);
    res.status(500).json({ error: 'Could not edit comment', details: err.message || err });
  }
};

exports.deleteHistoryComment = async (req, res) => {
  try {
    await Ticket.deleteHistoryComment(
      req.params.ticketNumber,
      Number(req.params.commentId)
    );
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (err) {
    console.error('Delete history comment error:', err);
    res.status(500).json({ error: 'Could not delete comment', details: err.message || err });
  }
};

exports.assignTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { developer } = req.body;
    if (!developer) return res.status(400).json({ error: 'Developer username required' });

    const ticket = await Ticket.getByTicketNumber(ticketNumber);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const success = await Ticket.update(ticketNumber, {
      assignedTo: developer,
      assignedDate: new Date().toISOString(),
      status: 'assigned',
      adminReview: 0
    });
    if (!success) return res.status(500).json({ error: 'Failed to assign ticket' });

    const updatedTicket = await Ticket.getByTicketNumber(ticketNumber);
    res.json({
      success: true,
      data: {
        ...updatedTicket,
        attachments: updatedTicket.attachments || []
      }
    });
  } catch (err) {
    console.error('Assign ticket error:', err);
    res.status(500).json({ error: 'Could not assign ticket', details: err.message || err });
  }
};

exports.updateRemark = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const { remark } = req.body;

    if (remark === undefined) {
      return res.status(400).json({ error: 'Remark text required' });
    }

    const ticket = await Ticket.getByTicketNumber(ticketNumber);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const success = await Ticket.updateRemark(ticketNumber, remark);
    if (!success) return res.status(500).json({ error: 'Failed to update remark' });

    res.json({
      success: true,
      data: {
        remark,
        ticketNumber
      }
    });
  } catch (err) {
    console.error('Update remark error:', err);
    res.status(500).json({ error: 'Could not update remark', details: err.message || err });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const ticket = await Ticket.getByTicketNumber(ticketNumber);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (ticket.status !== 'done' || ticket.adminReview !== 1) {
      return res.status(400).json({ error: 'Ticket is not ready for closing' });
    }

    const success = await Ticket.update(ticketNumber, {
      status: 'closed',
      adminReview: 0,
      closedAt: new Date().toISOString()
    });
    if (!success) return res.status(500).json({ error: 'Failed to close ticket' });

    const closedTicket = await Ticket.getByTicketNumber(ticketNumber);
    res.json({
      success: true,
      data: {
        ...closedTicket,
        attachments: closedTicket.attachments || []
      }
    });
  } catch (err) {
    console.error('Close ticket error:', err);
    res.status(500).json({ error: 'Could not close ticket', details: err.message || err });
  }
};
