import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Lists all policies. Can filter by isTemplate.
 */
export async function getPolicies(req: Request, res: Response) {
  const { isTemplate } = req.query;

  try {
    const whereClause: any = {};
    if (isTemplate !== undefined) {
      whereClause.isTemplate = isTemplate === 'true';
    }

    const policies = await prisma.trekPolicy.findMany({
      where: whereClause,
      orderBy: { title: 'asc' },
      include: {
        events: {
          select: { id: true, title: true, slug: true }
        }
      }
    });

    return res.json(policies);
  } catch (error) {
    console.error('Get policies error:', error);
    return res.status(500).json({ error: 'Failed to retrieve trek policies.' });
  }
}

/**
 * Gets a single policy by ID.
 */
export async function getPolicyById(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const policy = await prisma.trekPolicy.findUnique({
      where: { id },
      include: {
        events: {
          select: { id: true, title: true, slug: true }
        }
      }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy template not found.' });
    }

    return res.json(policy);
  } catch (error) {
    console.error('Get policy error:', error);
    return res.status(500).json({ error: 'Failed to retrieve policy details.' });
  }
}

/**
 * Creates a new policy template or custom trek policy.
 */
export async function createPolicy(req: AuthRequest, res: Response) {
  const data = req.body;

  try {
    // Check if title is unique
    const existing = await prisma.trekPolicy.findUnique({ where: { title: data.title } });
    if (existing) {
      return res.status(400).json({ error: 'A policy template with this title already exists.' });
    }

    const newPolicy = await prisma.trekPolicy.create({
      data: {
        title: data.title,
        isTemplate: data.isTemplate ?? false,
        letterTitle: data.letterTitle || 'Participant Responsibility Letter',
        letterDescription: data.letterDescription || '',
        letterTerms: data.letterTerms || '',
        letterWaiver: data.letterWaiver || '',
        letterDeclaration: data.letterDeclaration || '',
        letterCheckboxText: data.letterCheckboxText || 'I agree to all terms and declare myself medically fit.',
        termsAndConditions: data.termsAndConditions || '',
        privacyPolicy: data.privacyPolicy || '',
        thingsToCarry: JSON.stringify(data.thingsToCarry || []),
        thingsNotAllowed: JSON.stringify(data.thingsNotAllowed || []),
        medicalMandatoryFields: JSON.stringify(data.medicalMandatoryFields || []),
        safetyGuidelines: JSON.stringify(data.safetyGuidelines || []),
        cancellationRules: JSON.stringify(data.cancellationRules || []),
        refundPercentages: JSON.stringify(data.refundPercentages || []),
        weatherPolicy: data.weatherPolicy || '',
        organizerCancellationPolicy: data.organizerCancellationPolicy || '',
        noShowPolicy: data.noShowPolicy || '',
        faqs: JSON.stringify(data.faqs || []),
        prepTips: JSON.stringify(data.prepTips || []),
        fitnessRecommendations: JSON.stringify(data.fitnessRecommendations || []),
        clothingSuggestions: JSON.stringify(data.clothingSuggestions || []),
        foodRecommendations: JSON.stringify(data.foodRecommendations || []),
        weatherAdvice: data.weatherAdvice || '',
        equipmentRecommendations: data.equipmentRecommendations || '',
        trekInfoPdf: data.trekInfoPdf || null,
        thingsToCarryPdf: data.thingsToCarryPdf || null,
        responsibilityLetterPdf: data.responsibilityLetterPdf || null,
        safetyGuidelinesPdf: data.safetyGuidelinesPdf || null,
        medicalDeclarationPdf: data.medicalDeclarationPdf || null,
        cancellationPolicyPdf: data.cancellationPolicyPdf || null
      }
    });

    return res.status(201).json({
      message: 'Policy created successfully!',
      policy: newPolicy
    });
  } catch (error) {
    console.error('Create policy error:', error);
    return res.status(500).json({ error: 'Failed to create policy.' });
  }
}

/**
 * Updates a policy.
 */
export async function updatePolicy(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const data = req.body;

  try {
    const existing = await prisma.trekPolicy.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    // Check title uniqueness if changing title
    if (data.title && data.title !== existing.title) {
      const titleExists = await prisma.trekPolicy.findUnique({ where: { title: data.title } });
      if (titleExists) {
        return res.status(400).json({ error: 'A policy with this title already exists.' });
      }
    }

    const updatePayload: any = {};
    const stringFields = [
      'title', 'letterTitle', 'letterDescription', 'letterTerms', 'letterWaiver',
      'letterDeclaration', 'letterCheckboxText', 'weatherPolicy', 'organizerCancellationPolicy',
      'noShowPolicy', 'weatherAdvice', 'equipmentRecommendations', 'trekInfoPdf',
      'thingsToCarryPdf', 'responsibilityLetterPdf', 'safetyGuidelinesPdf',
      'medicalDeclarationPdf', 'cancellationPolicyPdf', 'termsAndConditions', 'privacyPolicy'
    ];

    stringFields.forEach(f => {
      if (data[f] !== undefined) updatePayload[f] = data[f];
    });

    if (data.isTemplate !== undefined) updatePayload.isTemplate = data.isTemplate;

    const jsonFields = [
      'thingsToCarry', 'thingsNotAllowed', 'medicalMandatoryFields', 'safetyGuidelines',
      'cancellationRules', 'refundPercentages', 'faqs', 'prepTips',
      'fitnessRecommendations', 'clothingSuggestions', 'foodRecommendations'
    ];

    jsonFields.forEach(f => {
      if (data[f] !== undefined) {
        updatePayload[f] = JSON.stringify(data[f]);
      }
    });

    const updated = await prisma.trekPolicy.update({
      where: { id },
      data: updatePayload
    });

    return res.json({
      message: 'Policy updated successfully!',
      policy: updated
    });
  } catch (error) {
    console.error('Update policy error:', error);
    return res.status(500).json({ error: 'Failed to update policy.' });
  }
}

/**
 * Duplicates an existing policy (creates a template copy).
 */
export async function duplicatePolicy(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const source = await prisma.trekPolicy.findUnique({ where: { id } });
    if (!source) {
      return res.status(404).json({ error: 'Source policy template not found.' });
    }

    // Generate unique name
    let copyTitle = `Copy of ${source.title}`;
    let isUnique = false;
    let counter = 1;
    while (!isUnique) {
      const existing = await prisma.trekPolicy.findUnique({ where: { title: copyTitle } });
      if (!existing) {
        isUnique = true;
      } else {
        copyTitle = `Copy of ${source.title} (${counter})`;
        counter++;
      }
    }

    const copy = await prisma.trekPolicy.create({
      data: {
        title: copyTitle,
        isTemplate: true,
        letterTitle: source.letterTitle,
        letterDescription: source.letterDescription,
        letterTerms: source.letterTerms,
        letterWaiver: source.letterWaiver,
        letterDeclaration: source.letterDeclaration,
        letterCheckboxText: source.letterCheckboxText,
        thingsToCarry: source.thingsToCarry,
        thingsNotAllowed: source.thingsNotAllowed,
        medicalMandatoryFields: source.medicalMandatoryFields,
        safetyGuidelines: source.safetyGuidelines,
        cancellationRules: source.cancellationRules,
        refundPercentages: source.refundPercentages,
        weatherPolicy: source.weatherPolicy,
        organizerCancellationPolicy: source.organizerCancellationPolicy,
        noShowPolicy: source.noShowPolicy,
        faqs: source.faqs,
        prepTips: source.prepTips,
        fitnessRecommendations: source.fitnessRecommendations,
        clothingSuggestions: source.clothingSuggestions,
        foodRecommendations: source.foodRecommendations,
        weatherAdvice: source.weatherAdvice,
        equipmentRecommendations: source.equipmentRecommendations,
        trekInfoPdf: source.trekInfoPdf,
        thingsToCarryPdf: source.thingsToCarryPdf,
        responsibilityLetterPdf: source.responsibilityLetterPdf,
        safetyGuidelinesPdf: source.safetyGuidelinesPdf,
        medicalDeclarationPdf: source.medicalDeclarationPdf,
        cancellationPolicyPdf: source.cancellationPolicyPdf
      }
    });

    return res.status(201).json({
      message: 'Policy template duplicated successfully!',
      policy: copy
    });
  } catch (error) {
    console.error('Duplicate policy error:', error);
    return res.status(500).json({ error: 'Failed to duplicate policy.' });
  }
}

/**
 * Deletes a policy.
 */
export async function deletePolicy(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const existing = await prisma.trekPolicy.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Policy not found.' });
    }

    await prisma.trekPolicy.delete({ where: { id } });
    return res.json({ message: 'Policy template deleted successfully.' });
  } catch (error) {
    console.error('Delete policy error:', error);
    return res.status(500).json({ error: 'Failed to delete policy.' });
  }
}

/**
 * Assigns a policy to multiple events.
 */
export async function assignPolicy(req: AuthRequest, res: Response) {
  const { policyId, eventIds } = req.body;

  try {
    if (!policyId || !eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ error: 'policyId and eventIds array are required.' });
    }

    const policy = await prisma.trekPolicy.findUnique({ where: { id: policyId } });
    if (!policy) {
      return res.status(404).json({ error: 'Target policy template not found.' });
    }

    // Update all matching events
    await prisma.event.updateMany({
      where: {
        id: { in: eventIds }
      },
      data: {
        policyId
      }
    });

    return res.json({
      message: 'Policy template assigned to expeditions successfully!'
    });
  } catch (error) {
    console.error('Assign policy error:', error);
    return res.status(500).json({ error: 'Failed to assign policy.' });
  }
}
